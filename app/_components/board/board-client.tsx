"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BoardColumn } from "./board-column";
import { boardColumns, type Task, type TaskStatus } from "@/app/_types/task";
import { Sidebar } from "@/app/_components/sidebar";
import { TaskDialog, type TaskDraft } from "./task-dialog";
import { authClient } from "@/lib/auth-client";
import { ProjectDialog, type ProjectDraft } from "@/app/_components/project-dialog";
import type { Project } from "@/app/_types/project";
import { ProjectMembersDialog } from "@/app/_components/project-members-dialog";

type BoardClientProps = {
  initialTasks: Task[];
  initialProjectId: string | null;
  initialProjects: Project[];
  userEmail: string;
  userName: string;
};

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

function getInitials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return `${words[0][0]}${words.at(-1)?.[0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || email.slice(0, 2)).toUpperCase();
}

export function BoardClient({
  initialTasks,
  initialProjectId,
  initialProjects,
  userEmail,
  userName,
}: BoardClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [projects, setProjects] = useState(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string>();
  const [projectDialog, setProjectDialog] = useState<Project | "create" | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [projectError, setProjectError] = useState<string>();
  const [savingProject, setSavingProject] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [pageError, setPageError] = useState<string>();
  const [signingOut, setSigningOut] = useState(false);
  const userInitials = getInitials(userName, userEmail);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

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
    if (!selectedProjectId) {
      setProjectError(undefined);
      setProjectDialog("create");
      return;
    }
    setDialogError(undefined);
    setDialog({ kind: "create", status });
  }

  function openEdit(task: Task) {
    setDialogError(undefined);
    setDialog({ kind: "edit", task });
  }

  async function saveTask(draft: TaskDraft) {
    if (!dialog || !selectedProjectId) return;
    setSaving(true);
    setDialogError(undefined);

    try {
      const editing = dialog.kind === "edit";
      const response = await fetch(
        editing
          ? `/api/tasks/${dialog.task.id}`
          : `/api/tasks?projectId=${encodeURIComponent(selectedProjectId)}`,
        {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
        },
      );

      if (!response.ok) throw new Error(await readApiError(response));

      const savedTask = toTask((await response.json()) as TaskApiResponse);
      setTasks((current) =>
        editing
          ? current.map((task) => (task.id === savedTask.id ? savedTask : task))
          : [...current, savedTask],
      );
      if (!editing) {
        setProjects((current) =>
          current.map((project) =>
            project.id === selectedProjectId
              ? { ...project, taskCount: project.taskCount + 1 }
              : project,
          ),
        );
      }
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
      setProjects((current) =>
        current.map((project) =>
          project.id === selectedProjectId
            ? { ...project, taskCount: Math.max(0, project.taskCount - 1) }
            : project,
        ),
      );
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete task.");
    }
  }

  async function selectProject(projectId: string) {
    if (projectId === selectedProjectId || loadingProject) return;
    setLoadingProject(true);
    setPageError(undefined);

    try {
      const response = await fetch(`/api/tasks?projectId=${encodeURIComponent(projectId)}`);
      if (!response.ok) throw new Error(await readApiError(response));
      const projectTasks = ((await response.json()) as TaskApiResponse[]).map(toTask);
      setSelectedProjectId(projectId);
      setTasks(projectTasks);
      setQuery("");
      setMembersDialogOpen(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load project.");
    } finally {
      setLoadingProject(false);
    }
  }

  async function saveProject(draft: ProjectDraft) {
    if (!projectDialog) return;
    setSavingProject(true);
    setProjectError(undefined);

    try {
      const editing = projectDialog !== "create";
      const response = await fetch(editing ? `/api/projects/${projectDialog.id}` : "/api/projects", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error(await readApiError(response));

      const savedProject = (await response.json()) as Project;
      setProjects((current) =>
        editing
          ? current.map((project) => (project.id === savedProject.id ? savedProject : project))
          : [...current, savedProject],
      );
      if (!editing) {
        setSelectedProjectId(savedProject.id);
        setTasks([]);
        setQuery("");
      }
      setProjectDialog(null);
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : "Unable to save project.");
    } finally {
      setSavingProject(false);
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete “${project.name}” and all of its tasks? This cannot be undone.`)) {
      return;
    }
    setPageError(undefined);

    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiError(response));

      const remaining = projects.filter((item) => item.id !== project.id);
      setProjects(remaining);
      if (project.id === selectedProjectId) {
        if (remaining[0]) {
          setSelectedProjectId(remaining[0].id);
          const tasksResponse = await fetch(
            `/api/tasks?projectId=${encodeURIComponent(remaining[0].id)}`,
          );
          if (!tasksResponse.ok) throw new Error(await readApiError(tasksResponse));
          setTasks(((await tasksResponse.json()) as TaskApiResponse[]).map(toTask));
        } else {
          setSelectedProjectId(null);
          setTasks([]);
          setQuery("");
        }
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete project.");
    }
  }

  async function signOut() {
    setSigningOut(true);
    const result = await authClient.signOut();

    if (result.error) {
      setPageError(result.error.message ?? "Unable to sign out.");
      setSigningOut(false);
      return;
    }

    router.push("/sign-in");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar
          onAddProject={() => {
            setProjectError(undefined);
            setProjectDialog("create");
          }}
          onDeleteProject={deleteProject}
          onEditProject={(project) => {
            setProjectError(undefined);
            setProjectDialog(project);
          }}
          onSelectProject={selectProject}
          projects={projects}
          selectedProjectId={selectedProjectId}
          taskCount={tasks.length}
        />

        <section className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <header className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-10 place-items-center rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-200">
                T
              </div>
              <span className="font-bold tracking-tight">Tasklist</span>
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

            <button
              className="ml-auto rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900 disabled:opacity-60"
              disabled={signingOut}
              onClick={signOut}
              type="button"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
            <div
              className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-sm font-bold text-amber-700"
              title={`${userName} (${userEmail})`}
            >
              {userInitials}
            </div>
          </header>

          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">
                <span>Projects</span><span>/</span><span className="text-slate-600">{selectedProject?.name ?? "No project"}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {selectedProject?.name ?? "Create your first project"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                {selectedProject?.description ||
                  (selectedProject
                    ? "Plan, organize, and finish your work."
                    : "Use the + next to Projects to create a workspace for your tasks.")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {selectedProject ? (
                <button
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                  onClick={() => setMembersDialogOpen(true)}
                  type="button"
                >
                  Manage members
                </button>
              ) : null}
              <button
                className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                onClick={() => openCreate("TODO")}
                type="button"
              >
                <span className="text-lg leading-none">+</span>{" "}
                {selectedProjectId ? "Add task" : "Create a project first"}
              </button>
            </div>
          </div>

          {pageError ? (
            <div className="mb-5 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <span>{pageError}</span>
              <button onClick={() => setPageError(undefined)} type="button">Dismiss</button>
            </div>
          ) : null}

          {selectedProject ? (
            <>
              <div className="mb-6 flex items-center justify-between border-b border-slate-200">
                <nav aria-label="Project views" className="flex gap-7">
                  <button className="border-b-2 border-indigo-600 px-1 pb-4 text-sm font-semibold text-indigo-600" type="button">
                    Board
                  </button>
                  <button className="px-1 pb-4 text-sm font-medium text-slate-400" type="button">List</button>
                  <button className="px-1 pb-4 text-sm font-medium text-slate-400" type="button">Timeline</button>
                </nav>
              </div>

              <div className={`grid items-start gap-5 overflow-x-auto pb-6 transition md:grid-cols-3 ${loadingProject ? "opacity-50" : ""}`}>
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
            </>
          ) : null}
        </section>
      </div>

      {dialog ? (
        <TaskDialog
          busy={saving}
          defaultAssigneeInitials={userInitials}
          error={dialogError}
          initialStatus={dialog.kind === "create" ? dialog.status : dialog.task.status}
          key={dialog.kind === "edit" ? dialog.task.id : `new-${dialog.status}`}
          onClose={() => (saving ? undefined : setDialog(null))}
          onSubmit={saveTask}
          task={dialog.kind === "edit" ? dialog.task : undefined}
        />
      ) : null}

      {projectDialog ? (
        <ProjectDialog
          busy={savingProject}
          error={projectError}
          key={projectDialog === "create" ? "new-project" : projectDialog.id}
          onClose={() => (savingProject ? undefined : setProjectDialog(null))}
          onSubmit={saveProject}
          project={projectDialog === "create" ? undefined : projectDialog}
        />
      ) : null}

      {membersDialogOpen && selectedProject ? (
        <ProjectMembersDialog
          key={selectedProject.id}
          onClose={() => setMembersDialogOpen(false)}
          project={selectedProject}
        />
      ) : null}
    </main>
  );
}
