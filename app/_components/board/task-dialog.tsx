"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { Task, TaskAssignee, TaskPriority, TaskStatus } from "@/app/_types/task";
import type { ProjectMember, ProjectMembersResponse } from "@/app/_types/project-member";

export type TaskDraft = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tag: string;
  assigneeIds: string[];
};

function getInitials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words.at(-1)?.[0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || email.slice(0, 2)).toUpperCase();
}

type TaskDialogProps = {
  task?: Task;
  projectId: string;
  initialStatus: TaskStatus;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (draft: TaskDraft) => Promise<void>;
};

export function TaskDialog({
  task,
  projectId,
  initialStatus,
  busy,
  error,
  onClose,
  onSubmit,
}: TaskDialogProps) {
  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? initialStatus,
    priority: task?.priority ?? "MEDIUM",
    dueDate: task?.dueDate?.slice(0, 10) ?? "",
    tag: task?.tag ?? "General",
    assigneeIds: task?.assignees.map((assignee) => assignee.id) ?? [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadMembers() {
      try {
        const response = await fetch(`/api/projects/${projectId}/members`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as ProjectMembersResponse;
        setMembers(data.members);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Unable to load project members.", error);
      } finally {
        if (!controller.signal.aborted) setMembersLoading(false);
      }
    }

    loadMembers();
    return () => controller.abort();
  }, [projectId]);

  useEffect(() => {
    if (!assigneeMenuOpen) return;

    function closeMenu(event: PointerEvent) {
      if (!assigneeMenuRef.current?.contains(event.target as Node)) {
        setAssigneeMenuOpen(false);
      }
    }

    function closeMenuOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAssigneeMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeMenuOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [assigneeMenuOpen]);

  const selectedPeople = draft.assigneeIds
    .map((id) => members.find((member) => member.user.id === id)?.user ?? task?.assignees.find((assignee) => assignee.id === id))
    .filter((person): person is TaskAssignee => person !== undefined);
  const visibleNames = selectedPeople.slice(0, 2).map((person) => person.name).join(", ");
  const remainingCount = Math.max(0, draft.assigneeIds.length - 2);
  const assigneeSummary = draft.assigneeIds.length === 0
    ? "No one"
    : selectedPeople.length === 0
      ? membersLoading ? "Loading members..." : `${draft.assigneeIds.length} selected`
      : `${visibleNames}${remainingCount > 0 ? `, +${remainingCount}` : ""}`;

  function toggleAssignee(userId: string) {
    update(
      "assigneeIds",
      draft.assigneeIds.includes(userId)
        ? draft.assigneeIds.filter((id) => id !== userId)
        : [...draft.assigneeIds, userId],
    );
  }

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

          <div className="relative" ref={assigneeMenuRef}>
            <span className="block text-sm font-semibold text-slate-700" id="assignee-label">
              Assignee
            </span>
            <button
              aria-controls="assignee-options"
              aria-expanded={assigneeMenuOpen}
              aria-label={`Assignee: ${assigneeSummary}`}
              className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-sm font-normal text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              onClick={() => setAssigneeMenuOpen((open) => !open)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                {selectedPeople.length > 0 ? (
                  <span className="flex shrink-0 -space-x-2" aria-hidden="true">
                    {selectedPeople.slice(0, 2).map((person) => (
                      <span className="grid size-7 place-items-center overflow-hidden rounded-full border-2 border-white bg-indigo-100 text-[10px] font-bold text-indigo-700" key={person.id}>
                        {person.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" className="size-full object-cover" src={person.image} />
                        ) : (
                          getInitials(person.name, person.email)
                        )}
                      </span>
                    ))}
                  </span>
                ) : null}
                <span className={`min-w-0 truncate ${selectedPeople.length === 0 ? "text-slate-400" : ""}`}>
                  {assigneeSummary}
                </span>
              </span>
              <span className="text-xs text-slate-400">⌄</span>
            </button>

            {assigneeMenuOpen ? (
              <div
                aria-labelledby="assignee-label"
                className="mt-2 max-h-40 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
                id="assignee-options"
                role="group"
              >
                {members.map((member) => {
                  const selected = draft.assigneeIds.includes(member.user.id);
                  return (
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        selected
                          ? "bg-indigo-50 font-semibold text-indigo-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                      key={member.id}
                    >
                      <input
                        checked={selected}
                        className="size-4 shrink-0 accent-indigo-600"
                        onChange={() => toggleAssignee(member.user.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block truncate">{member.user.name}</span>
                        <span className="block truncate text-xs font-normal text-slate-400">
                          {member.user.email}
                        </span>
                      </span>
                    </label>
                  );
                })}
                {membersLoading ? <p className="px-3 py-2.5 text-sm text-slate-400">Loading members...</p> : null}
                {!membersLoading && members.length === 0 ? <p className="px-3 py-2.5 text-sm text-slate-400">No members available</p> : null}
              </div>
            ) : null}
          </div>
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
