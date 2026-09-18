export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  code: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tag: string;
  assigneeInitials: string;
  commentsCount: number;
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
