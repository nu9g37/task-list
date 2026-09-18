import { prisma } from "@/lib/prisma";
import { getRequestSession } from "@/lib/auth-session";
import { parseProjectInput } from "@/lib/project-input";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(
    projects.map(({ _count, ...project }) => ({ ...project, taskCount: _count.tasks })),
  );
}

export async function POST(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseProjectInput(body);
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      creatorId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
  });

  return Response.json({ ...project, taskCount: 0 }, { status: 201 });
}
