"use client";

import { FormEvent, useState } from "react";
import type { Project, ProjectColor } from "@/app/_types/project";

export type ProjectDraft = {
  name: string;
  description: string;
  color: ProjectColor;
};

type ProjectDialogProps = {
  project?: Project;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (draft: ProjectDraft) => Promise<void>;
};

const colors: { value: ProjectColor; label: string; className: string }[] = [
  { value: "indigo", label: "Indigo", className: "bg-indigo-500" },
  { value: "emerald", label: "Emerald", className: "bg-emerald-500" },
  { value: "amber", label: "Amber", className: "bg-amber-500" },
  { value: "rose", label: "Rose", className: "bg-rose-500" },
  { value: "sky", label: "Sky", className: "bg-sky-500" },
];

export function ProjectDialog({ project, busy, error, onClose, onSubmit }: ProjectDialogProps) {
  const [draft, setDraft] = useState<ProjectDraft>({
    name: project?.name ?? "",
    description: project?.description ?? "",
    color: project?.color ?? "indigo",
  });

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
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7"
        onSubmit={handleSubmit}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              {project ? "Project settings" : "New project"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              {project ? "Edit project" : "Create a project"}
            </h2>
          </div>
          <button
            aria-label="Close project dialog"
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
            Name
            <input
              autoFocus
              className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              maxLength={80}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="e.g. Website redesign"
              required
              value={draft.name}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Description
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 font-normal outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              maxLength={500}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="What is this project about?"
              value={draft.description}
            />
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">Color</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {colors.map((color) => (
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                    draft.color === color.value
                      ? "border-slate-400 bg-slate-50 text-slate-900"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                  key={color.value}
                >
                  <input
                    checked={draft.color === color.value}
                    className="sr-only"
                    name="project-color"
                    onChange={() => setDraft((current) => ({ ...current, color: color.value }))}
                    type="radio"
                    value={color.value}
                  />
                  <span className={`size-3 rounded-full ${color.className}`} />
                  {color.label}
                </label>
              ))}
            </div>
          </fieldset>
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
            {busy ? "Saving..." : project ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}
