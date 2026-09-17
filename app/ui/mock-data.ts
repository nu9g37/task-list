export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tag: string;
  assignee: {
    initials: string;
    color: string;
  };
  comments: number;
};

export type BoardColumnData = {
  title: string;
  status: TaskStatus;
  dotColor: string;
};

export const boardColumns: BoardColumnData[] = [
  { title: "To do", status: "TODO", dotColor: "bg-slate-400" },
  {
    title: "In progress",
    status: "IN_PROGRESS",
    dotColor: "bg-indigo-500",
  },
  { title: "Done", status: "DONE", dotColor: "bg-emerald-500" },
];

export const tasks: Task[] = [
  {
    id: "TSK-01",
    title: "Design the MongoDB schema",
    description: "Define project and task collections for the first release.",
    status: "TODO",
    priority: "HIGH",
    dueDate: "Sep 20",
    tag: "Backend",
    assignee: { initials: "KP", color: "bg-amber-100 text-amber-700" },
    comments: 3,
  },
  {
    id: "TSK-02",
    title: "Create task modal",
    description: "Design fields for title, status, priority, and deadline.",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "Sep 22",
    tag: "Frontend",
    assignee: { initials: "NS", color: "bg-sky-100 text-sky-700" },
    comments: 1,
  },
  {
    id: "TSK-03",
    title: "Build Kanban board UI",
    description: "Create reusable columns and task cards with mock data.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueDate: "Today",
    tag: "Frontend",
    assignee: { initials: "KP", color: "bg-amber-100 text-amber-700" },
    comments: 4,
  },
  {
    id: "TSK-04",
    title: "Write the project brief",
    description: "Explain the problem, target users, and MVP scope.",
    status: "IN_PROGRESS",
    priority: "LOW",
    dueDate: "Sep 24",
    tag: "Planning",
    assignee: { initials: "PT", color: "bg-emerald-100 text-emerald-700" },
    comments: 2,
  },
  {
    id: "TSK-05",
    title: "Initialize Next.js project",
    description: "Set up TypeScript, Tailwind CSS, and Git repository.",
    status: "DONE",
    priority: "MEDIUM",
    tag: "Setup",
    assignee: { initials: "KP", color: "bg-amber-100 text-amber-700" },
    comments: 0,
  },
];
