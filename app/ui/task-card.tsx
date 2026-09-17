import type { Task, TaskPriority } from "./mock-data";

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-rose-50 text-rose-700",
};

type TaskCardProps = {
  task: Task;
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
          {task.tag}
        </span>
        <button
          aria-label={`More options for ${task.title}`}
          className="rounded-lg px-2 text-lg leading-none text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
          type="button"
        >
          ···
        </button>
      </div>

      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {task.id}
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
          {task.dueDate ? (
            <span
              className={`text-xs font-medium ${
                task.dueDate === "Today" ? "text-rose-500" : "text-slate-400"
              }`}
            >
              {task.dueDate}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {task.comments > 0 ? (
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
              {task.comments}
            </span>
          ) : null}
          <span
            className={`grid size-8 place-items-center rounded-full text-[10px] font-bold ${task.assignee.color}`}
          >
            {task.assignee.initials}
          </span>
        </div>
      </div>
    </article>
  );
}
