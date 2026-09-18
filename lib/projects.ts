import { prisma } from "@/lib/prisma";

type ProjectUser = {
  id: string;
  name: string;
};

export async function getOrCreatePrimaryProject(user: ProjectUser) {
  const membership = await prisma.projectMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { project: true },
  });

  if (membership) {
    return membership.project;
  }

  return prisma.project.create({
    data: {
      name: `${user.name}'s Tasks`,
      description: "Your personal Tasklist workspace.",
      creatorId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });
}
