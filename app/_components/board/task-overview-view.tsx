"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { Task, TaskStatus } from "@/app/_types/task";
import { TaskListView } from "./task-list-view";

type TaskOverviewViewProps = {
  tasks: Task[];
  partial?: boolean;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
  toolbarActions?: ReactNode;
};

const statusCards: { status: TaskStatus; label: string; style: string; dot: string }[] = [
  { status: "TODO", label: "To do", style: "border-slate-200 bg-white", dot: "bg-slate-400" },
  { status: "IN_PROGRESS", label: "In progress", style: "border-indigo-200 bg-indigo-50/50", dot: "bg-indigo-500" },
  { status: "DONE", label: "Done", style: "border-emerald-200 bg-emerald-50/50", dot: "bg-emerald-500" },
];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function TaskOverviewView({ tasks, partial, onDelete, onEdit, onStatusChange, toolbarActions }: TaskOverviewViewProps) {
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6);
    const start = dateKey(today);
    const end = dateKey(lastDay);
    return tasks
      .filter((task) => {
        const dueDate = task.dueDate?.slice(0, 10);
        return dueDate && dueDate >= start && dueDate <= end;
      })
      .sort((first, second) => first.dueDate!.localeCompare(second.dueDate!));
  }, [tasks]);

  return (
    <div className="pb-8">
      <section aria-label="Task status summary" className="grid grid-cols-3 gap-2 sm:gap-4">
        {statusCards.map((card) => (
          <div className={`min-w-0 rounded-2xl border p-3 shadow-sm sm:p-5 ${card.style}`} key={card.status}>
            <div className="flex items-start gap-1.5 text-[11px] font-semibold leading-4 text-slate-600 sm:items-center sm:gap-2.5 sm:text-sm">
              <span aria-hidden="true" className={`mt-1 size-2 shrink-0 rounded-full sm:mt-0 sm:size-2.5 ${card.dot}`} />
              {card.label}
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:mt-5 sm:text-4xl">
              {tasks.filter((task) => task.status === card.status).length}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{partial ? "loaded tasks" : "tasks"}</p>
          </div>
        ))}
      </section>

      <section aria-label="Tasks due in the next 7 days" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Coming up{partial ? " among loaded tasks" : ""}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Due in the next 7 days</h2>
          </div>
          <span className="text-sm font-medium text-slate-500">
            {upcomingTasks.length} {upcomingTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
        <TaskListView
          emptyMessage="No tasks due in the next 7 days"
          onDelete={onDelete}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          tasks={upcomingTasks}
          toolbarActions={toolbarActions}
        />
      </section>
    </div>
  );
}
