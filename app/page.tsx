import { prisma } from "@/lib/prisma";
import { BoardClient } from "@/app/_components/board/board-client";
import type { Task } from "@/app/_types/task";
import type { Project, ProjectColor } from "@/app/_types/project";
import { getCurrentSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getCurrentSession();
  if (!session) redirect("/sign-in");

  const projectRecords = await prisma.project.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "asc" },
  });
  const project = projectRecords[0];
  const records = await prisma.task.findMany({
    where: { project: { members: { some: { userId: session.user.id } } } },
    include: {
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      project: { select: { id: true, name: true, color: true } },
    },
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
    assignees: task.assignees.map((assignment) => assignment.user),
    commentsCount: task.commentsCount,
    project: {
      ...task.project,
      color: task.project.color as ProjectColor,
    },
  }));

  const projects: Project[] = projectRecords.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    color: item.color as ProjectColor,
    taskCount: item._count.tasks,
  }));

  return (
    <BoardClient
      initialTasks={tasks}
      initialProjectId={project?.id ?? null}
      initialProjects={projects}
      userEmail={session.user.email}
      userId={session.user.id}
      userName={session.user.name}
      userImage={session.user.image ?? null}
      initialMyTaskCount={await prisma.taskAssignee.count({
        where: {
          userId: session.user.id,
          task: { project: { members: { some: { userId: session.user.id } } } },
        },
      })}
    />
  );
}
