import { prisma } from "@/lib/prisma";

export const taskInclude = {
  assignees: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  },
  project: { select: { id: true, name: true, color: true } },
} as const;

export function serializeTask<
  T extends { assignees: { user: { id: string; name: string; email: string; image: string | null } }[] },
>(task: T) {
  const { assignees, ...data } = task;
  return { ...data, assignees: assignees.map((assignment) => assignment.user) };
}

export async function areProjectMembers(projectId: string, userIds: string[]) {
  if (userIds.length === 0) return true;
  const count = await prisma.projectMember.count({
    where: { projectId, userId: { in: userIds } },
  });
  return count === userIds.length;
}
