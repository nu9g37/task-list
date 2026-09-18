import { prisma } from "@/lib/prisma";
import { BoardClient } from "./ui/board-client";
import type { Task } from "./ui/mock-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const records = await prisma.task.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  const tasks: Task[] = records.map((task) => ({
    id: task.id,
    code: task.code,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString(),
    tag: task.tag,
    assigneeInitials: task.assigneeInitials,
    commentsCount: task.commentsCount,
  }));

  return <BoardClient initialTasks={tasks} />;
}
