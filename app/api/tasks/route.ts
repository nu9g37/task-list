import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { parseTaskInput } from "@/lib/task-input";

export const runtime = "nodejs";

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return Response.json(tasks);
}

export async function POST(request: Request) {
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

  const status = parsed.data.status ?? "TODO";
  const lastTask = await prisma.task.findFirst({
    where: { status },
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
      assigneeInitials: parsed.data.assigneeInitials ?? "KP",
      position: (lastTask?.position ?? -1) + 1,
    },
  });

  return Response.json(task, { status: 201 });
}
