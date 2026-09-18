import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { parseTaskInput } from "@/lib/task-input";
import { getRequestSession } from "@/lib/auth-session";

export const runtime = "nodejs";

const taskInclude = {
  assignees: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  project: { select: { id: true, name: true, color: true } },
} as const;

function serializeTask<
  T extends { assignees: { user: { id: string; name: string; email: string; image: string | null } }[] },
>(task: T) {
  const { assignees, ...data } = task;
  return { ...data, assignees: assignees.map((assignment) => assignment.user) };
}

async function areProjectMembers(projectId: string, userIds: string[]) {
  if (userIds.length === 0) return true;
  const count = await prisma.projectMember.count({
    where: { projectId, userId: { in: userIds } },
  });
  return count === userIds.length;
}

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
  const assignedToMe = url.searchParams.get("assignedToMe") === "true";
  if (assignedToMe) {
    const tasks = await prisma.task.findMany({
      where: {
        assignees: { some: { userId: session.user.id } },
        project: { members: { some: { userId: session.user.id } } },
      },
      include: taskInclude,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });
    return Response.json(tasks.map(serializeTask));
  }

  const requestedProjectId = url.searchParams.get("projectId");
  const requestedProject = await getAccessibleProject(
    session.user.id,
    requestedProjectId,
  );
  if (requestedProjectId && !requestedProject) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }
  if (!requestedProject) return Response.json([]);
  const project = requestedProject;
  const tasks = await prisma.task.findMany({
    where: { projectId: project.id },
    include: taskInclude,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return Response.json(tasks.map(serializeTask));
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const requestedProjectId = url.searchParams.get("projectId");
  if (!requestedProjectId) {
    return Response.json({ error: "Project is required." }, { status: 400 });
  }
  const requestedProject = await getAccessibleProject(session.user.id, requestedProjectId);
  if (!requestedProject) {
    return Response.json({ error: "Project not found." }, { status: 404 });
  }
  const project = requestedProject;
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

  const task = await prisma.task.create({
    data: {
      code: `TSK-${randomUUID().slice(0, 6).toUpperCase()}`,
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
  });

  return Response.json(serializeTask(task), { status: 201 });
}
