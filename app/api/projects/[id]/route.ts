import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/auth-session";
import { parseProjectInput } from "@/lib/project-input";

export const runtime = "nodejs";

type ProjectRouteContext = { params: Promise<{ id: string }> };

async function findMembership(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    include: { project: { include: { _count: { select: { tasks: true } } } } },
  });
}

export async function GET(request: Request, { params }: ProjectRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const membership = await findMembership(id, session.user.id);
  if (!membership) return Response.json({ error: "Project not found." }, { status: 404 });

  const { _count, ...project } = membership.project;
  return Response.json({ ...project, taskCount: _count.tasks });
}

export async function PATCH(request: Request, { params }: ProjectRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const membership = await findMembership(id, session.user.id);
  if (!membership) return Response.json({ error: "Project not found." }, { status: 404 });
  if (membership.role !== "OWNER") {
    return Response.json({ error: "Only the project owner can edit this project." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseProjectInput(body);
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 });

  const project = await prisma.project.update({ where: { id }, data: parsed.data });
  return Response.json({ ...project, taskCount: membership.project._count.tasks });
}

export async function DELETE(request: Request, { params }: ProjectRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const membership = await findMembership(id, session.user.id);
  if (!membership) return Response.json({ error: "Project not found." }, { status: 404 });
  if (membership.role !== "OWNER") {
    return Response.json({ error: "Only the project owner can delete this project." }, { status: 403 });
  }

  await prisma.project.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
