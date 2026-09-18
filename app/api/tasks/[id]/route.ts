import { prisma } from "@/lib/prisma";
import { parseTaskInput } from "@/lib/task-input";
import { getRequestSession } from "@/lib/auth-session";

export const runtime = "nodejs";

type TaskRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: TaskRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseTaskInput(body, false);
  if (!parsed.success) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return Response.json({ error: "No task fields were provided." }, { status: 400 });
  }

  const existingTask = await prisma.task.findFirst({
    where: { id, project: { members: { some: { userId: session.user.id } } } },
  });
  if (!existingTask) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  const task = await prisma.task.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json(task);
}

export async function DELETE(request: Request, { params }: TaskRouteContext) {
  const session = await getRequestSession(request);
  if (!session) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const existingTask = await prisma.task.findFirst({
    where: { id, project: { members: { some: { userId: session.user.id } } } },
    select: { id: true },
  });

  if (!existingTask) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  await prisma.task.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
