"use client";

import { useState } from "react";
import {
  boardColumns,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/app/_types/task";

type TaskListViewProps = {
  tasks: Task[];
  onAdd: (status: Task["status"]) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
};

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700",
};

function formatDueDate(value?: string) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function TaskListView({ tasks, onAdd, onDelete, onEdit }: TaskListViewProps) {
  const [collapsedSections, setCollapsedSections] = useState<Partial<Record<TaskStatus, boolean>>>({});

  function toggleSection(status: TaskStatus) {
    setCollapsedSections((current) => ({
      ...current,
      [status]: !current[status],
    }));
  }

  return (
    <div className="space-y-6 pb-8">
      {boardColumns.map((section) => {
        const sectionTasks = tasks.filter((task) => task.status === section.status);
        const collapsed = collapsedSections[section.status] ?? false;

        return (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" key={section.status}>
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
              <button
                aria-expanded={!collapsed}
                className="flex items-center gap-2.5 rounded-lg text-left transition hover:text-indigo-600"
                onClick={() => toggleSection(section.status)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`text-xs text-slate-400 transition-transform ${collapsed ? "-rotate-90" : "rotate-0"}`}
                >
                  ▼
                </span>
                <span className={`size-2.5 rounded-full ${section.dotColor}`} />
                <h2 className="text-sm font-bold text-slate-700">{section.title}</h2>
                <span className="grid size-6 place-items-center rounded-full bg-white text-xs font-semibold text-slate-400 shadow-sm">
                  {sectionTasks.length}
                </span>
              </button>
              <button
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                onClick={() => onAdd(section.status)}
                type="button"
              >
                + Add task
              </button>
            </div>

            {!collapsed && sectionTasks.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {sectionTasks.map((task) => (
                  <div
                    className="grid gap-3 px-4 py-4 transition hover:bg-slate-50/70 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:px-5"
                    key={task.id}
                  >
                    <div className="min-w-0 text-left">
                      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {task.code} · {task.tag}
                      </span>
                      <span className="mt-1 block truncate text-sm font-semibold text-slate-800">
                        {task.title}
                      </span>
                      {task.description ? (
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {task.description}
                        </span>
                      ) : null}
                    </div>

                    <span className={`w-fit rounded-lg px-2 py-1 text-[10px] font-bold tracking-wide ${priorityStyles[task.priority]}`}>
                      {task.priority}
                    </span>

                    <div className="min-w-36 text-xs text-slate-500">
                      <p>{formatDueDate(task.dueDate)}</p>
                      <p className="mt-1 max-w-48 truncate text-slate-400" title={task.assignees.map((assignee) => assignee.name).join(", ")}>
                        {task.assignees.length > 0
                          ? task.assignees.map((assignee) => assignee.name).join(", ")
                          : "No one"}
                      </p>
                    </div>

                    <div className="flex justify-end gap-1">
                      <button
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"
                        onClick={() => onEdit(task)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => onDelete(task)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : !collapsed ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No tasks yet</div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
