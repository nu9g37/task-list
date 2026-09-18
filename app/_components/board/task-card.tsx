import { useEffect, useRef, useState } from "react";
import type { Task, TaskPriority } from "@/app/_types/task";

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700",
};

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const assigneeStyles = [
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
];

function getAssigneeStyle(value: string) {
  const total = [...value].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return assigneeStyles[total % assigneeStyles.length];
}

function getInitials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words.at(-1)?.[0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || email.slice(0, 2)).toUpperCase();
}

function formatDueDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return sameDay
    ? "Today"
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dueDate = task.dueDate ? formatDueDate(task.dueDate) : undefined;

  useEffect(() => {
    if (!isMenuOpen) return;

    function closeMenu(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function closeMenuOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenuOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [isMenuOpen]);

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
          {task.tag}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label={`Actions for ${task.title}`}
            className="grid size-8 place-items-center rounded-lg text-lg font-bold leading-none tracking-wider text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            <span aria-hidden="true" className="-translate-y-0.5">
              ...
            </span>
          </button>

          <div
            aria-label={`Actions for ${task.title}`}
            className={`absolute right-0 top-9 z-10 w-32 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-lg transition ${
              isMenuOpen
                ? "visible scale-100 opacity-100"
                : "invisible scale-95 opacity-0"
            }`}
            role="menu"
          >
            <button
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
              onClick={() => {
                setIsMenuOpen(false);
                onEdit(task);
              }}
              role="menuitem"
              tabIndex={isMenuOpen ? 0 : -1}
              type="button"
            >
              Edit
            </button>
            <button
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-500 transition hover:bg-rose-50 hover:text-rose-600"
              onClick={() => {
                setIsMenuOpen(false);
                onDelete(task);
              }}
              role="menuitem"
              tabIndex={isMenuOpen ? 0 : -1}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {task.code}
      </p>
      <h3 className="font-semibold leading-6 text-slate-800">{task.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">
        {task.description}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-lg px-2 py-1 text-[10px] font-bold tracking-wide ${priorityStyles[task.priority]}`}
          >
            {task.priority}
          </span>
          {dueDate ? (
            <span
              className={`text-xs font-medium ${
                dueDate === "Today" ? "text-rose-500" : "text-slate-400"
              }`}
            >
              {dueDate}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {task.commentsCount > 0 ? (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.142-4.03 7.5-9 7.5a10.1 10.1 0 0 1-4.38-.97L3 19.5l1.14-3.42A6.63 6.63 0 0 1 3 12c0-4.142 4.03-7.5 9-7.5s9 3.358 9 7.5Z"
                />
              </svg>
              {task.commentsCount}
            </span>
          ) : null}
          {task.assignees.length > 0 ? (
            <div className="flex -space-x-2" aria-label="Task assignees">
              {task.assignees.slice(0, 3).map((assignee) => {
                const assigneeInitials = getInitials(assignee.name, assignee.email);
                return (
                  <span
                    className={`grid size-8 place-items-center rounded-full border-2 border-white text-[10px] font-bold ${getAssigneeStyle(assignee.email)}`}
                    key={assignee.id}
                    title={`${assignee.name} (${assignee.email})`}
                  >
                    {assigneeInitials}
                  </span>
                );
              })}
              {task.assignees.length > 3 ? (
                <span className="grid size-8 place-items-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-500">
                  +{task.assignees.length - 3}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-400">No one</span>
          )}
        </div>
      </div>
    </article>
  );
}
