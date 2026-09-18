"use client";

import { FormEvent, useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "@/app/_types/task";

export type TaskDraft = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tag: string;
  assigneeInitials: string;
};

type TaskDialogProps = {
  task?: Task;
  initialStatus: TaskStatus;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (draft: TaskDraft) => Promise<void>;
};

export function TaskDialog({
  task,
  initialStatus,
  busy,
  error,
  onClose,
  onSubmit,
}: TaskDialogProps) {
  const [draft, setDraft] = useState<TaskDraft>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? initialStatus,
    priority: task?.priority ?? "MEDIUM",
    dueDate: task?.dueDate?.slice(0, 10) ?? "",
    tag: task?.tag ?? "General",
    assigneeInitials: task?.assigneeInitials ?? "KP",
  });

  function update<Field extends keyof TaskDraft>(field: Field, value: TaskDraft[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(draft);
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <form
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
        onSubmit={handleSubmit}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">{task ? task.code : "New task"}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {task ? "Edit task" : "Add a task"}
            </h2>
          </div>
          <button
            aria-label="Close task dialog"
            className="grid size-10 place-items-center rounded-xl text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Title
            <input
              autoFocus
              className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              maxLength={160}
              onChange={(event) => update("title", event.target.value)}
              placeholder="What needs to be done?"
              required
              value={draft.title}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              maxLength={1000}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Add a little context..."
              value={draft.description}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Status
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                onChange={(event) => update("status", event.target.value as TaskStatus)}
                value={draft.status}
              >
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Priority
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                onChange={(event) => update("priority", event.target.value as TaskPriority)}
                value={draft.priority}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Due date
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                onChange={(event) => update("dueDate", event.target.value)}
                type="date"
                value={draft.dueDate}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Tag
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                maxLength={40}
                onChange={(event) => update("tag", event.target.value)}
                required
                value={draft.tag}
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Assignee initials
            <input
              className="mt-2 w-28 rounded-xl border border-slate-200 px-3.5 py-3 font-normal uppercase outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              maxLength={3}
              onChange={(event) => update("assigneeInitials", event.target.value)}
              required
              value={draft.assigneeInitials}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? "Saving..." : task ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </div>
  );
}
