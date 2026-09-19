"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/app/_types/task";
import type { ProjectColor } from "@/app/_types/project";

type TaskListViewProps = {
  tasks: Task[];
  emptyMessage?: string;
  toolbarActions?: ReactNode;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
};

type SortOption = "default" | "dueDate" | "priority" | "title" | "status";

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700",
};

const statusStyles: Record<TaskStatus, string> = {
  TODO: "border-slate-200 bg-slate-100 text-slate-700",
  IN_PROGRESS: "border-indigo-200 bg-indigo-50 text-indigo-700",
  DONE: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

const projectStyles: Record<ProjectColor, string> = {
  indigo: "bg-indigo-50 text-indigo-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  sky: "bg-sky-50 text-sky-700",
};

function formatDueDate(value?: string) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words.at(-1)?.[0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || email.slice(0, 2)).toUpperCase();
}

export function TaskListView({
  tasks,
  emptyMessage = "No tasks yet",
  toolbarActions,
  onDelete,
  onEdit,
  onStatusChange,
}: TaskListViewProps) {
  const [openTaskMenuId, setOpenTaskMenuId] = useState<string>();
  const [updatingStatusTaskId, setUpdatingStatusTaskId] = useState<string>();
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const openMenuRef = useRef<HTMLDivElement>(null);

  const sortedTasks = useMemo(() => {
    if (sortBy === "default") return tasks;

    const priorityOrder: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const statusOrder: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 1, DONE: 2 };

    return [...tasks].sort((first, second) => {
      if (sortBy === "title") return first.title.localeCompare(second.title);
      if (sortBy === "priority") {
        return priorityOrder[first.priority] - priorityOrder[second.priority];
      }
      if (sortBy === "status") return statusOrder[first.status] - statusOrder[second.status];

      if (!first.dueDate && !second.dueDate) return 0;
      if (!first.dueDate) return 1;
      if (!second.dueDate) return -1;
      return new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime();
    });
  }, [sortBy, tasks]);

  useEffect(() => {
    if (!openTaskMenuId) return;

    function closeMenu(event: PointerEvent) {
      if (!openMenuRef.current?.contains(event.target as Node)) setOpenTaskMenuId(undefined);
    }

    function closeMenuOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenTaskMenuId(undefined);
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenuOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [openTaskMenuId]);

  async function changeStatus(task: Task, status: TaskStatus) {
    if (status === task.status) return;
    setUpdatingStatusTaskId(task.id);
    try {
      await onStatusChange(task, status);
    } finally {
      setUpdatingStatusTaskId(undefined);
    }
  }

  return (
    <div className="pb-8">
      <div className="mb-4 flex flex-wrap items-center justify-start gap-2">
        <label className="text-sm font-medium text-slate-500" htmlFor="task-sort">
          Sort by
        </label>
        <select
          className="h-11 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
          id="task-sort"
          onChange={(event) => setSortBy(event.target.value as SortOption)}
          value={sortBy}
        >
          <option value="default">Default</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
        </select>
        {toolbarActions}
      </div>

      <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
        {tasks.length > 0 ? (
          <div className="divide-y divide-slate-100 xl:min-w-[880px]">
            <div className="hidden grid-cols-[minmax(180px,1fr)_140px_110px_85px_170px_36px] items-center gap-5 bg-slate-50/80 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 xl:grid">
              <span>Task</span>
              <span>Status</span>
              <span>Due date</span>
              <span>Priority</span>
              <span>Assignee</span>
              <span className="sr-only">Actions</span>
            </div>
            {sortedTasks.map((task, index) => (
                  <div
                    className="relative grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-x-4 gap-y-3 px-4 py-3 transition hover:bg-slate-50/70 sm:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(180px,1fr)_140px_110px_85px_170px_36px] xl:gap-5 xl:px-5 xl:py-4"
                    key={task.id}
                  >
                    <div className="col-start-1 row-start-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {task.code} · {task.tag}
                      </span>
                      <span className={`inline-block max-w-40 truncate rounded-md px-2 py-0.5 text-[10px] font-semibold ${projectStyles[task.project.color]}`}>
                        {task.project.name}
                      </span>
                    </div>
                    <div className="col-start-1 row-start-2 min-w-0 self-center text-left">
                      <span className="line-clamp-2 text-base font-bold leading-snug text-slate-900 sm:text-lg xl:line-clamp-1">
                        {task.title}
                      </span>
                      {task.description ? (
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {task.description}
                        </span>
                      ) : null}
                    </div>

                    <label className="relative col-start-2 row-start-2 w-32 justify-self-end sm:w-fit xl:row-start-1 xl:row-span-2 xl:w-full xl:justify-self-start">
                      <span className="sr-only">Status for {task.title}</span>
                      <select
                        className={`w-full cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-wait disabled:opacity-60 sm:text-sm ${statusStyles[task.status]}`}
                        disabled={updatingStatusTaskId === task.id}
                        onChange={(event) => changeStatus(task, event.target.value as TaskStatus)}
                        value={task.status}
                      >
                        {(Object.keys(statusLabels) as TaskStatus[]).map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="col-start-1 row-start-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 xl:contents">
                      <p className="whitespace-nowrap text-xs text-slate-500 xl:col-start-3 xl:row-start-1 xl:row-span-2">
                        {formatDueDate(task.dueDate)}
                      </p>
                      <span className={`w-fit rounded-lg px-2 py-1 text-[10px] font-bold tracking-wide xl:col-start-4 xl:row-start-1 xl:row-span-2 ${priorityStyles[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.assignees.length > 0 ? (
                      <div
                        className="col-start-2 row-start-3 flex min-w-0 items-center justify-self-end gap-2 xl:col-start-5 xl:row-start-1 xl:row-span-2 xl:justify-self-start"
                        title={task.assignees.map((assignee) => assignee.name).join(", ")}
                      >
                        <div className="flex shrink-0 -space-x-2">
                          {task.assignees.slice(0, 3).map((assignee) => (
                            <span
                              className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white bg-indigo-100 text-[9px] font-bold text-indigo-700"
                              key={assignee.id}
                            >
                              {assignee.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  alt={assignee.name}
                                  className="size-full object-cover"
                                  src={assignee.image}
                                />
                              ) : (
                                getInitials(assignee.name, assignee.email)
                              )}
                            </span>
                          ))}
                          {task.assignees.length > 3 ? (
                            <span className="grid size-7 place-items-center rounded-full border-2 border-white bg-slate-100 text-[9px] font-bold text-slate-500">
                              +{task.assignees.length - 3}
                            </span>
                          ) : null}
                        </div>
                        <span className="max-w-32 truncate text-sm text-slate-500">
                          {task.assignees.map((assignee) => assignee.name).join(", ")}
                        </span>
                      </div>
                    ) : (
                      <p className="col-start-2 row-start-3 justify-self-end text-xs text-slate-400 xl:col-start-5 xl:row-start-1 xl:row-span-2 xl:justify-self-start">No one</p>
                    )}

                    <div
                      className="relative col-start-2 row-start-1 flex justify-self-end xl:col-start-6 xl:row-span-2"
                      ref={openTaskMenuId === task.id ? openMenuRef : undefined}
                    >
                      <button
                        aria-expanded={openTaskMenuId === task.id}
                        aria-haspopup="menu"
                        aria-label={`Actions for ${task.title}`}
                        className="grid size-9 place-items-center rounded-lg text-lg font-bold leading-none tracking-wider text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        onClick={() =>
                          setOpenTaskMenuId((current) =>
                            current === task.id ? undefined : task.id,
                          )
                        }
                        type="button"
                      >
                        <span aria-hidden="true" className="-translate-y-0.5">...</span>
                      </button>

                      <div
                        className={`absolute right-0 top-10 z-10 w-32 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg transition ${index === 0 ? "" : "xl:bottom-10 xl:top-auto xl:origin-bottom-right"} ${
                          openTaskMenuId === task.id
                            ? "visible scale-100 opacity-100"
                            : "invisible scale-95 opacity-0"
                        }`}
                        role="menu"
                      >
                        <button
                          className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
                          onClick={() => {
                            setOpenTaskMenuId(undefined);
                            onEdit(task);
                          }}
                          role="menuitem"
                          tabIndex={openTaskMenuId === task.id ? 0 : -1}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => {
                            setOpenTaskMenuId(undefined);
                            onDelete(task);
                          }}
                          role="menuitem"
                          tabIndex={openTaskMenuId === task.id ? 0 : -1}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-slate-400">{emptyMessage}</div>
        )}
      </section>
    </div>
  );
}
