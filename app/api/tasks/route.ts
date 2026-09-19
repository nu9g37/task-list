import { prisma } from "@/lib/prisma";
import { createWithUniqueTaskCode } from "@/lib/tasks/code";
import { parseTaskInput } from "@/lib/tasks/input";
import { getRequestSession } from "@/lib/auth-session";
import { TASK_PAGE_SIZE, parseTaskPage } from "@/lib/tasks/page";
import { areProjectMembers, serializeTask, taskInclude } from "@/lib/tasks/query";
import { buildTaskWhere } from "@/lib/tasks/filter";

export const runtime = "nodejs";

async function getAccessibleProject(userId: string, projectId: string | null) {
  return prisma.project.findFirst({
    where: {
      ...(projectId ? { id: projectId } : {}),
      members: { some: { userId } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const page = parseTaskPage(url.searchParams);
  if (!page) return Response.json({ error: "Invalid task query." }, { status: 400 });
  const allProjects = url.searchParams.get("allProjects") === "true";
  const assignedToMe = url.searchParams.get("assignedToMe") === "true";
  const requestedProjectId = url.searchParams.get("projectId");
  let projectId: string | undefined;
  if (!allProjects && !assignedToMe) {
    const project = await getAccessibleProject(session.user.id, requestedProjectId);
    if (!project && requestedProjectId) return Response.json({ error: "Project not found." }, { status: 404 });
    if (!project) return Response.json({ items: [], total: 0, page: page.page, hasMore: false });
    projectId = project.id;
  }
  const where = buildTaskWhere(session.user.id, projectId, assignedToMe, page);
  const [total, tasks] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      skip: page.skip,
      take: TASK_PAGE_SIZE,
    }),
  ]);
  return Response.json({ items: tasks.map(serializeTask), total, page: page.page, hasMore: page.skip + tasks.length < total });
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const requestedProjectId = url.searchParams.get("projectId");
  if (!requestedProjectId) {
    return Response.json({ error: "Project is required." }, { status: 400 });
  }
  const project = await getAccessibleProject(session.user.id, requestedProjectId);
  if (!project) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseTaskInput(body, true);
  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const assigneeIds = parsed.data.assigneeIds ?? [];
  if (!(await areProjectMembers(project.id, assigneeIds))) {
    return Response.json(
      { error: "Every assignee must be a member of this project." },
      { status: 400 },
    );
  }

  const status = parsed.data.status ?? "TODO";
  const lastTask = await prisma.task.findFirst({
    where: { status, projectId: project.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const task = await createWithUniqueTaskCode((code) => prisma.task.create({
    data: {
      code,
      title: parsed.data.title!,
      description: parsed.data.description ?? "",
      status,
      priority: parsed.data.priority ?? "MEDIUM",
      dueDate: parsed.data.dueDate,
      tag: parsed.data.tag ?? "General",
      projectId: project.id,
      creatorId: session.user.id,
      assignees: assigneeIds.length
        ? { create: assigneeIds.map((userId) => ({ userId })) }
        : undefined,
      position: (lastTask?.position ?? -1) + 1,
    },
    include: taskInclude,
  }));

  return Response.json(serializeTask(task), { status: 201 });
}
