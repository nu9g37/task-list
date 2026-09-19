import type { Prisma } from "@/app/generated/prisma/client";
import type { parseTaskPage } from "@/lib/tasks/page";

type TaskPage = NonNullable<ReturnType<typeof parseTaskPage>>;

export function buildTaskWhere(
  userId: string,
  projectId: string | undefined,
  assignedToMe: boolean,
  page: TaskPage,
): Prisma.TaskWhereInput {
  const conditions: Prisma.TaskWhereInput[] = [
    { project: { members: { some: { userId } } } },
  ];
  if (projectId) conditions.push({ projectId });
  if (assignedToMe) conditions.push({ assignees: { some: { userId } } });
  if (page.priority) conditions.push({ priority: page.priority as "LOW" | "MEDIUM" | "HIGH" });
  if (page.search) {
    conditions.push({ OR: [
      { title: { contains: page.search, mode: "insensitive" } },
      { code: { contains: page.search, mode: "insensitive" } },
    ] });
  }
  if (page.assigneeIds.length) {
    conditions.push({ assignees: { some: { userId: { in: page.assigneeIds } } } });
  }
  return { AND: conditions };
}
