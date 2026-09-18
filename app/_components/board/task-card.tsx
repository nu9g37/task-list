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

function getAssigneeStyle(initials: string) {
  const total = [...initials].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return assigneeStyles[total % assigneeStyles.length];
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
  const dueDate = task.dueDate ? formatDueDate(task.dueDate) : undefined;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
          {task.tag}
        </span>
        <div className="flex items-center gap-1">
          <button
            aria-label={`Edit ${task.title}`}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
            onClick={() => onEdit(task)}
            type="button"
          >
            Edit
          </button>
          <button
            aria-label={`Delete ${task.title}`}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
            onClick={() => onDelete(task)}
            type="button"
          >
            Delete
          </button>
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
          <span
            className={`grid size-8 place-items-center rounded-full text-[10px] font-bold ${getAssigneeStyle(task.assigneeInitials)}`}
          >
            {task.assigneeInitials}
          </span>
        </div>
      </div>
    </article>
  );
}
