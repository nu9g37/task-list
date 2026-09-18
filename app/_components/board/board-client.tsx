"use client";

import { useMemo, useState } from "react";
import { BoardColumn } from "./board-column";
import { boardColumns, type Task, type TaskStatus } from "@/app/_types/task";
import { Sidebar } from "@/app/_components/sidebar";
import { TaskDialog, type TaskDraft } from "./task-dialog";

type BoardClientProps = { initialTasks: Task[] };

type TaskApiResponse = Omit<Task, "dueDate"> & { dueDate: string | null };

type DialogState =
  | { kind: "create"; status: TaskStatus }
  | { kind: "edit"; task: Task }
  | null;

function toTask(value: TaskApiResponse): Task {
  return { ...value, dueDate: value.dueDate ?? undefined };
}

async function readApiError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Something went wrong. Please try again.";
}

export function BoardClient({ initialTasks }: BoardClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string>();
  const [pageError, setPageError] = useState<string>();

  const visibleTasks = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return tasks;
    return tasks.filter((task) =>
      [task.code, task.title, task.description, task.tag, task.assigneeInitials]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }, [query, tasks]);

  function openCreate(status: TaskStatus) {
    setDialogError(undefined);
    setDialog({ kind: "create", status });
  }

  function openEdit(task: Task) {
    setDialogError(undefined);
    setDialog({ kind: "edit", task });
  }

  async function saveTask(draft: TaskDraft) {
    if (!dialog) return;
    setSaving(true);
    setDialogError(undefined);

    try {
      const editing = dialog.kind === "edit";
      const response = await fetch(editing ? `/api/tasks/${dialog.task.id}` : "/api/tasks", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) throw new Error(await readApiError(response));

      const savedTask = toTask((await response.json()) as TaskApiResponse);
      setTasks((current) =>
        editing
          ? current.map((task) => (task.id === savedTask.id ? savedTask : task))
          : [...current, savedTask],
      );
      setDialog(null);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : "Unable to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    setPageError(undefined);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiError(response));
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete task.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar />

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <header className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-10 place-items-center rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-200">
                T
              </div>
              <span className="font-bold tracking-tight">Task List</span>
            </div>

            <label className="hidden w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-sm sm:flex">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="Search tasks"
                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks..."
                type="search"
                value={query}
              />
            </label>

            <div className="ml-auto grid size-11 place-items-center rounded-2xl bg-amber-100 text-sm font-bold text-amber-700">
              KP
            </div>
          </header>

          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">
                <span>Projects</span><span>/</span><span className="text-slate-600">CEDT Internship Portfolio</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Product Development
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Plan, build, and ship the first version of Taskflow.
              </p>
            </div>

            <button
              className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              onClick={() => openCreate("TODO")}
              type="button"
            >
              <span className="text-lg leading-none">+</span> Add task
            </button>
          </div>

          <div className="mb-6 flex items-center justify-between border-b border-slate-200">
            <nav aria-label="Project views" className="flex gap-7">
              <button className="border-b-2 border-indigo-600 px-1 pb-4 text-sm font-semibold text-indigo-600" type="button">
                Board
              </button>
              <button className="px-1 pb-4 text-sm font-medium text-slate-400" type="button">List</button>
              <button className="px-1 pb-4 text-sm font-medium text-slate-400" type="button">Timeline</button>
            </nav>
          </div>

          {pageError ? (
            <div className="mb-5 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <span>{pageError}</span>
              <button onClick={() => setPageError(undefined)} type="button">Dismiss</button>
            </div>
          ) : null}

          <div className="grid items-start gap-5 overflow-x-auto pb-6 md:grid-cols-3">
            {boardColumns.map((column) => (
              <BoardColumn
                column={column}
                key={column.status}
                onAdd={openCreate}
                onDelete={deleteTask}
                onEdit={openEdit}
                tasks={visibleTasks.filter((task) => task.status === column.status)}
              />
            ))}
          </div>
        </section>
      </div>

      {dialog ? (
        <TaskDialog
          busy={saving}
          error={dialogError}
          initialStatus={dialog.kind === "create" ? dialog.status : dialog.task.status}
          key={dialog.kind === "edit" ? dialog.task.id : `new-${dialog.status}`}
          onClose={() => (saving ? undefined : setDialog(null))}
          onSubmit={saveTask}
          task={dialog.kind === "edit" ? dialog.task : undefined}
        />
      ) : null}
    </main>
  );
}
