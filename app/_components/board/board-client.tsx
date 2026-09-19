"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BoardColumn } from "./board-column";
import { boardColumns, type Task, type TaskAssignee, type TaskPriority, type TaskStatus } from "@/app/_types/task";
import { Sidebar } from "@/app/_components/sidebar";
import { TaskDialog, type TaskDraft } from "./task-dialog";
import { authClient } from "@/lib/auth-client";
import { ProjectDialog, type ProjectDraft } from "@/app/_components/project-dialog";
import type { Project } from "@/app/_types/project";
import { ProjectMembersDialog } from "@/app/_components/project-members-dialog";
import { TaskListView } from "./task-list-view";
import { TaskCalendarView } from "./task-calendar-view";
import { TaskOverviewView } from "./task-overview-view";
import type { ProjectMembersResponse } from "@/app/_types/project-member";
import { ProfileDialog } from "@/app/_components/profile-dialog";
import { UserAvatar } from "@/app/_components/user-avatar";
import { readApiError, readTaskPage, taskPageUrl, toTask, type WorkspaceView } from "./task-api";

type BoardClientProps = {
  initialTasks: Task[];
  initialTaskTotal: number;
  initialProjectId: string | null;
  initialProjects: Project[];
  initialMyTaskCount: number;
  userEmail: string;
  userId: string;
  userName: string;
  userImage: string | null;
};

type DialogState =
  | { kind: "create"; status: TaskStatus }
  | { kind: "edit"; task: Task }
  | null;

type ProjectView = "board" | "list" | "calendar";
type TaskApiResponse = Parameters<typeof toTask>[0];
type LoadedTaskPage = Awaited<ReturnType<typeof readTaskPage>>;

export function BoardClient({
  initialTasks,
  initialTaskTotal,
  initialProjectId,
  initialProjects,
  initialMyTaskCount,
  userEmail,
  userId,
  userName,
  userImage,
}: BoardClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [taskTotal, setTaskTotal] = useState(initialTaskTotal);
  const [hasMoreTasks, setHasMoreTasks] = useState(initialTasks.length < initialTaskTotal);
  const [taskPage, setTaskPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastFilterKey = useRef("");
  const [projects, setProjects] = useState(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [myTaskCount, setMyTaskCount] = useState(initialMyTaskCount);
  const [query, setQuery] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<TaskAssignee[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string>();
  const filterRef = useRef<HTMLDivElement>(null);
  const [projectView, setProjectView] = useState<ProjectView>("board");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string>();
  const [projectDialog, setProjectDialog] = useState<Project | "create" | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [projectError, setProjectError] = useState<string>();
  const [savingProject, setSavingProject] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [pageError, setPageError] = useState<string>();
  const [profileName, setProfileName] = useState(userName);
  const [profileImage, setProfileImage] = useState(userImage);
  const [profileOpen, setProfileOpen] = useState(false);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const hasActiveFilters = selectedAssigneeIds.length > 0 || selectedPriority !== null;
  const activeQueryKey = JSON.stringify([workspaceView, selectedProjectId, query, selectedPriority, selectedAssigneeIds]);
  const activeQueryRef = useRef(activeQueryKey);
  useEffect(() => {
    if (!mobileNavOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileNavOpen]);

  useEffect(() => {
    activeQueryRef.current = activeQueryKey;
  }, [activeQueryKey]);

  function showFirstTaskPage(result: LoadedTaskPage) {
    setTasks(result.tasks);
    setTaskTotal(result.total);
    setHasMoreTasks(result.hasMore);
    setTaskPage(1);
  }

  async function refreshCurrentTasks() {
    const key = activeQueryRef.current;
    try {
      const result = await readTaskPage(taskPageUrl(workspaceView, selectedProjectId, 1, query, selectedPriority, selectedAssigneeIds));
      if (activeQueryRef.current !== key) return;
      showFirstTaskPage(result);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to refresh tasks.");
    }
  }

  useEffect(() => {
    const key = JSON.stringify([workspaceView, selectedProjectId, query, selectedPriority, selectedAssigneeIds]);
    if (!lastFilterKey.current) {
      lastFilterKey.current = key;
      return;
    }
    if (lastFilterKey.current === key) return;
    lastFilterKey.current = key;
    if (workspaceView === "project" && !selectedProjectId) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      readTaskPage(taskPageUrl(workspaceView, selectedProjectId, 1, query, selectedPriority, selectedAssigneeIds), controller.signal)
        .then((result) => {
          showFirstTaskPage(result);
        })
        .catch((error) => {
          if (error instanceof Error && error.name !== "AbortError") setPageError(error.message);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [workspaceView, selectedProjectId, query, selectedPriority, selectedAssigneeIds]);

  async function loadMoreTasks() {
    if (loadingMore || !hasMoreTasks) return;
    setLoadingMore(true);
    try {
      const nextPage = taskPage + 1;
      const result = await readTaskPage(taskPageUrl(workspaceView, selectedProjectId, nextPage, query, selectedPriority, selectedAssigneeIds));
      setTasks((current) => [...current, ...result.tasks.filter((item) => !current.some((task) => task.id === item.id))]);
      setTaskTotal(result.total);
      setHasMoreTasks(result.hasMore);
      setTaskPage(nextPage);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load more tasks.");
    } finally {
      setLoadingMore(false);
    }
  }

  const availableAssignees = useMemo(() => {
    const people = new Map<string, TaskAssignee>();
    for (const member of workspaceView === "project" ? projectMembers : []) {
      people.set(member.id, member);
    }
    for (const task of tasks) {
      for (const assignee of task.assignees) people.set(assignee.id, assignee);
    }
    return [...people.values()].sort((first, second) => first.name.localeCompare(second.name));
  }, [projectMembers, tasks, workspaceView]);

  useEffect(() => {
    if (!filterOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!filterRef.current?.contains(event.target as Node)) setFilterOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFilterOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filterOpen]);

  useEffect(() => {
    if (!filterOpen || workspaceView !== "project" || !selectedProjectId) return;
    const controller = new AbortController();
    fetch(`/api/projects/${encodeURIComponent(selectedProjectId)}/members`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await readApiError(response));
        return (await response.json()) as ProjectMembersResponse;
      })
      .then((data) => setProjectMembers(data.members.map((member) => member.user)))
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setMembersError("Unable to load project members.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setMembersLoading(false);
      });
    return () => controller.abort();
  }, [filterOpen, selectedProjectId, workspaceView]);

  const visibleTasks = useMemo(() => {
    const search = query.trim().toLowerCase();
    return tasks.filter((task) =>
      (!search || task.code.toLowerCase().includes(search) || task.title.toLowerCase().includes(search)) &&
      (!selectedPriority || task.priority === selectedPriority) &&
      (selectedAssigneeIds.length === 0 || task.assignees.some((assignee) => selectedAssigneeIds.includes(assignee.id))),
    );
  }, [query, selectedAssigneeIds, selectedPriority, tasks]);

  function clearFilters() {
    setSelectedAssigneeIds([]);
    setSelectedPriority(null);
  }

  function resetSearchAndFilters() {
    setQuery("");
    clearFilters();
    setFilterOpen(false);
    setProjectMembers([]);
    setMembersError(undefined);
  }

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
      const wasAssignedToMe = editing
        ? dialog.task.assignees.some((assignee) => assignee.id === userId)
        : false;
      const isAssignedToMe = savedTask.assignees.some((assignee) => assignee.id === userId);
      setTasks((current) => {
        if (workspaceView === "my-tasks" && !isAssignedToMe) {
          return current.filter((task) => task.id !== savedTask.id);
        }
        return editing
          ? current.map((task) => (task.id === savedTask.id ? savedTask : task))
          : [...current, savedTask];
      });
      if (wasAssignedToMe !== isAssignedToMe) {
        setMyTaskCount((current) => Math.max(0, current + (isAssignedToMe ? 1 : -1)));
      }
      if (!editing) {
        setTaskTotal((current) => current + 1);
        setProjects((current) =>
          current.map((project) =>
            project.id === selectedProjectId
              ? { ...project, taskCount: project.taskCount + 1 }
              : project,
          ),
        );
      }
      setDialog(null);
      await refreshCurrentTasks();
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
      setTaskTotal((current) => Math.max(0, current - 1));
      if (task.assignees.some((assignee) => assignee.id === userId)) {
        setMyTaskCount((current) => Math.max(0, current - 1));
      }
      setProjects((current) =>
        current.map((project) =>
          project.id === task.project.id
            ? { ...project, taskCount: Math.max(0, project.taskCount - 1) }
            : project,
        ),
      );
      await refreshCurrentTasks();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete task.");
    }
  }

  async function changeTaskStatus(task: Task, status: TaskStatus) {
    setPageError(undefined);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await readApiError(response));

      const savedTask = toTask((await response.json()) as TaskApiResponse);
      setTasks((current) =>
        current.map((item) => (item.id === savedTask.id ? savedTask : item)),
      );
      await refreshCurrentTasks();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update task status.");
    }
  }

  async function selectProject(projectId: string) {
    if (loadingProject) return;
    if (projectId === selectedProjectId && workspaceView === "project") {
      setProjectView("board");
      return;
    }
    setLoadingProject(true);
    setPageError(undefined);

    try {
      const result = await readTaskPage(taskPageUrl("project", projectId, 1, "", null, []));
      setSelectedProjectId(projectId);
      setWorkspaceView("project");
      setProjectView("board");
      showFirstTaskPage(result);
      resetSearchAndFilters();
      setMembersDialogOpen(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load project.");
    } finally {
      setLoadingProject(false);
    }
  }

  async function openMyTasks() {
    if (loadingProject) return;
    if (workspaceView === "my-tasks") {
      setProjectView("board");
      return;
    }
    setLoadingProject(true);
    setPageError(undefined);

    try {
      const result = await readTaskPage(taskPageUrl("my-tasks", selectedProjectId, 1, "", null, []));
      showFirstTaskPage(result);
      setMyTaskCount(result.total);
      setWorkspaceView("my-tasks");
      setProjectView("board");
      resetSearchAndFilters();
      setMembersDialogOpen(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load your tasks.");
    } finally {
      setLoadingProject(false);
    }
  }

  async function openCalendar() {
    if (loadingProject) return;
    if (workspaceView === "calendar") return;
    setLoadingProject(true);
    setPageError(undefined);

    try {
      const result = await readTaskPage(taskPageUrl("calendar", selectedProjectId, 1, "", null, []));
      showFirstTaskPage(result);
      setWorkspaceView("calendar");
      resetSearchAndFilters();
      setMembersDialogOpen(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load calendar.");
    } finally {
      setLoadingProject(false);
    }
  }

  async function openOverview() {
    if (loadingProject || workspaceView === "overview") return;
    setLoadingProject(true);
    setPageError(undefined);

    try {
      const result = await readTaskPage(taskPageUrl("overview", selectedProjectId, 1, "", null, []));
      showFirstTaskPage(result);
      setWorkspaceView("overview");
      resetSearchAndFilters();
      setMembersDialogOpen(false);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load overview.");
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
      if (editing) {
        setTasks((current) =>
          current.map((task) =>
            task.project.id === savedProject.id
              ? {
                  ...task,
                  project: {
                    id: savedProject.id,
                    name: savedProject.name,
                    color: savedProject.color,
                  },
                }
              : task,
          ),
        );
      }
      if (!editing) {
        setSelectedProjectId(savedProject.id);
        setWorkspaceView("project");
        setProjectView("board");
        setTasks([]);
        setTaskTotal(0);
        setHasMoreTasks(false);
        setTaskPage(1);
        resetSearchAndFilters();
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
      if (workspaceView === "my-tasks" || workspaceView === "calendar" || workspaceView === "overview") {
        const result = await readTaskPage(taskPageUrl(workspaceView, selectedProjectId, 1, query, selectedPriority, selectedAssigneeIds));
        showFirstTaskPage(result);
        const assigned = await readTaskPage(taskPageUrl("my-tasks", null, 1, "", null, []));
        setMyTaskCount(assigned.total);
        if (project.id === selectedProjectId) setSelectedProjectId(remaining[0]?.id ?? null);
      } else if (project.id === selectedProjectId) {
        if (remaining[0]) {
          setSelectedProjectId(remaining[0].id);
          const result = await readTaskPage(taskPageUrl("project", remaining[0].id, 1, "", null, []));
          showFirstTaskPage(result);
          resetSearchAndFilters();
        } else {
          setSelectedProjectId(null);
          setTasks([]);
          setTaskTotal(0);
          setHasMoreTasks(false);
          setTaskPage(1);
          resetSearchAndFilters();
        }
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete project.");
    }
  }

  async function saveProfileName(name: string): Promise<string | undefined> {
    const result = await authClient.updateUser({ name });
    if (result.error) return result.error.message ?? "Unable to update your name.";
    setProfileName(name);
    setTasks((current) => current.map((task) => ({
      ...task,
      assignees: task.assignees.map((assignee) =>
        assignee.id === userId ? { ...assignee, name } : assignee,
      ),
    })));
    setProjectMembers((current) => current.map((member) =>
      member.id === userId ? { ...member, name } : member,
    ));
    return undefined;
  }

  async function saveProfileImage(image: string): Promise<string | undefined> {
    const result = await authClient.updateUser({ image });
    if (result.error) return result.error.message ?? "Unable to update your picture.";
    setProfileImage(image);
    setTasks((current) => current.map((task) => ({
      ...task,
      assignees: task.assignees.map((assignee) =>
        assignee.id === userId ? { ...assignee, image } : assignee,
      ),
    })));
    setProjectMembers((current) => current.map((member) =>
      member.id === userId ? { ...member, image } : member,
    ));
    return undefined;
  }

  async function signOut(): Promise<string | undefined> {
    const result = await authClient.signOut();

    if (result.error) {
      return result.error.message ?? "Unable to sign out.";
    }

    router.push("/sign-in");
    router.refresh();
    return undefined;
  }

  async function changeProfilePassword(currentPassword: string, newPassword: string): Promise<string | undefined> {
    const result = await authClient.changePassword({ currentPassword, newPassword });
    if (result.error) return result.error.message ?? "Unable to change your password.";
    return undefined;
  }

  const searchControl = (
    <div className="flex h-11 w-full min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-400 shadow-sm focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50 sm:max-w-md">
      <span aria-hidden="true">⌕</span>
      <input
        aria-label="Search task code or name"
        className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search code or task name..."
        type="text"
        value={query}
      />
      {query ? (
        <button
          aria-label="Clear search"
          className="grid size-5 shrink-0 place-items-center rounded-full text-base leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => setQuery("")}
          type="button"
        >
          ×
        </button>
      ) : null}
    </div>
  );

  const filterControl = (
    <div className="relative shrink-0" ref={filterRef}>
      <button
        aria-label={hasActiveFilters ? "Filter tasks, filters active" : "Filter tasks"}
        aria-controls="task-filter-panel"
        aria-expanded={filterOpen}
        aria-haspopup="dialog"
        className="relative flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
        onClick={() => {
          if (!filterOpen) {
            setMembersLoading(workspaceView === "project" && !!selectedProjectId);
            setMembersError(undefined);
          }
          setFilterOpen((current) => !current);
        }}
        type="button"
      >
        <span aria-hidden="true">☷</span>
        Filter
        {hasActiveFilters ? (
          <span aria-hidden="true" className="absolute -right-1 -top-1 size-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
        ) : null}
      </button>
      {filterOpen ? (
        <div
          aria-label="Task filters"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-xl"
          id="task-filter-panel"
          role="dialog"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Filters</h2>
            <button
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 disabled:opacity-40"
              disabled={!hasActiveFilters}
              onClick={clearFilters}
              type="button"
            >
              Clear filter
            </button>
          </div>
          {workspaceView !== "my-tasks" ? (
            <fieldset>
              <legend className="mb-2 font-semibold text-slate-700">Assignee</legend>
              <div className="max-h-44 space-y-1 overflow-y-auto">
                {availableAssignees.map((assignee) => (
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50" key={assignee.id}>
                    <input
                      checked={selectedAssigneeIds.includes(assignee.id)}
                      className="size-4 accent-indigo-600"
                      onChange={() => setSelectedAssigneeIds((current) =>
                        current.includes(assignee.id)
                          ? current.filter((id) => id !== assignee.id)
                          : [...current, assignee.id],
                      )}
                      type="checkbox"
                    />
                    <span className="truncate">{assignee.name}</span>
                  </label>
                ))}
                {availableAssignees.length === 0 ? (
                  <p className="px-2 py-1 text-slate-400">{membersLoading ? "Loading members..." : "No assignees available"}</p>
                ) : null}
              </div>
              {membersError ? <p className="mt-2 text-xs text-rose-600">{membersError}</p> : null}
            </fieldset>
          ) : null}
          <fieldset className={workspaceView !== "my-tasks" ? "mt-4 border-t border-slate-100 pt-4" : ""}>
            <legend className="font-semibold text-slate-700">Priority</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["LOW", "MEDIUM", "HIGH"] as TaskPriority[]).map((priority) => (
                <label className={`cursor-pointer rounded-lg border px-2 py-2 text-center text-xs font-semibold ${selectedPriority === priority ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-indigo-200"}`} key={priority}>
                  <input
                    checked={selectedPriority === priority}
                    className="sr-only"
                    onChange={() => setSelectedPriority(priority)}
                    type="radio"
                    name="task-priority-filter"
                    value={priority}
                  />
                  {priority.charAt(0) + priority.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-950 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1800px] lg:h-full lg:min-h-0">
        <Sidebar
          activeView={workspaceView}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onAddProject={() => {
            setProjectError(undefined);
            setProjectDialog("create");
          }}
          onDeleteProject={deleteProject}
          onEditProject={(project) => {
            setProjectError(undefined);
            setProjectDialog(project);
          }}
          onMyTasks={openMyTasks}
          onOverview={openOverview}
          onCalendar={openCalendar}
          onSelectProject={selectProject}
          projects={projects}
          selectedProjectId={selectedProjectId}
          taskCount={myTaskCount}
          userEmail={userEmail}
          userImage={profileImage}
          userName={profileName}
          onProfile={() => setProfileOpen(true)}
        />

        <section className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:px-10 lg:py-8">
          <header className="mb-5 flex items-center justify-between gap-4 lg:hidden">
            <div className="flex items-center gap-3">
              <button
                aria-expanded={mobileNavOpen}
                aria-label="Open navigation"
                className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                type="button"
              >
                <span aria-hidden="true" className="text-2xl leading-none">☰</span>
              </button>
              <div className="grid size-10 place-items-center rounded-2xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-200">
                T
              </div>
              <span className="font-bold tracking-tight">Tasklist</span>
            </div>

            <button
              aria-label="Open profile"
              className="rounded-full"
              onClick={() => setProfileOpen(true)}
              type="button"
            >
              <UserAvatar email={userEmail} image={profileImage} name={profileName} />
            </button>
          </header>

          <div className="mb-6 flex flex-col gap-4 sm:mb-8 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="mb-2 hidden items-center gap-2 text-sm font-medium text-slate-400 lg:flex">
                {workspaceView === "my-tasks" ? (
                  <span className="text-slate-600">My tasks</span>
                ) : workspaceView === "calendar" ? (
                  <span className="text-slate-600">Calendar</span>
                ) : workspaceView === "overview" ? (
                  <span className="text-slate-600">Overview</span>
                ) : (
                  <><span>Projects</span><span>/</span><span className="text-slate-600">{selectedProject?.name ?? "No project"}</span></>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 lg:text-4xl">
                {workspaceView === "my-tasks"
                  ? "My tasks"
                  : workspaceView === "calendar"
                    ? "Calendar"
                    : workspaceView === "overview"
                      ? "Overview"
                  : selectedProject?.name ?? "Create your first project"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 lg:text-base">
                {workspaceView === "my-tasks"
                  ? "Tasks assigned to you across all projects."
                  : workspaceView === "calendar"
                    ? "Due dates across all your projects."
                    : workspaceView === "overview"
                      ? "A snapshot of tasks across all your projects."
                  : selectedProject?.description ||
                    (selectedProject
                      ? "Plan, organize, and finish your work."
                      : "Use the + next to Projects to create a workspace for your tasks.")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {workspaceView === "project" ? (
                <>
                  <button
                    className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                    onClick={() => openCreate("TODO")}
                    type="button"
                  >
                    <span className="text-lg leading-none">+</span>{" "}
                    {selectedProjectId ? "Add task" : "Create a project first"}
                  </button>
                  {selectedProject ? (
                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
                      onClick={() => setMembersDialogOpen(true)}
                      type="button"
                    >
                      Manage members
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {pageError ? (
            <div className="mb-5 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <span>{pageError}</span>
              <button onClick={() => setPageError(undefined)} type="button">Dismiss</button>
            </div>
          ) : null}

          {workspaceView !== "project" || selectedProject ? (
            <>
              {workspaceView === "project" || workspaceView === "my-tasks" ? <div className="mb-6 flex items-center justify-between border-b border-slate-200">
                <nav aria-label="Project views" className="flex gap-7">
                  <button
                    aria-current={projectView === "board" ? "page" : undefined}
                    className={`px-1 pb-4 text-sm transition ${
                      projectView === "board"
                        ? "border-b-2 border-indigo-600 font-semibold text-indigo-600"
                        : "font-medium text-slate-400 hover:text-slate-700"
                    }`}
                    onClick={() => {
                      setFilterOpen(false);
                      setProjectView("board");
                    }}
                    type="button"
                  >
                    Board
                  </button>
                  <button
                    aria-current={projectView === "list" ? "page" : undefined}
                    className={`px-1 pb-4 text-sm transition ${
                      projectView === "list"
                        ? "border-b-2 border-indigo-600 font-semibold text-indigo-600"
                        : "font-medium text-slate-400 hover:text-slate-700"
                    }`}
                    onClick={() => {
                      setFilterOpen(false);
                      setProjectView("list");
                    }}
                    type="button"
                  >
                    List
                  </button>
                  <button
                    aria-current={projectView === "calendar" ? "page" : undefined}
                    className={`px-1 pb-4 text-sm transition ${
                      projectView === "calendar"
                        ? "border-b-2 border-indigo-600 font-semibold text-indigo-600"
                        : "font-medium text-slate-400 hover:text-slate-700"
                    }`}
                    onClick={() => {
                      setFilterOpen(false);
                      setQuery("");
                      clearFilters();
                      setProjectView("calendar");
                    }}
                    type="button"
                  >
                    Calendar
                  </button>
                </nav>
              </div> : null}

              {hasMoreTasks && (workspaceView === "overview" || workspaceView === "calendar" || projectView === "calendar") ? (
                <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
                  Showing {tasks.length} of {taskTotal} tasks. Load more to see the complete summary or calendar.
                </p>
              ) : null}
              <div className={`transition ${loadingProject ? "opacity-50" : ""}`}>
                {workspaceView === "overview" ? (
                  <TaskOverviewView
                    partial={hasMoreTasks}
                    onDelete={deleteTask}
                    onEdit={openEdit}
                    onStatusChange={changeTaskStatus}
                    tasks={visibleTasks}
                    toolbarActions={filterControl}
                  />
                ) : workspaceView === "calendar" ? (
                  <TaskCalendarView
                    key="all-projects"
                    onDelete={deleteTask}
                    onEdit={openEdit}
                    onStatusChange={changeTaskStatus}
                    tasks={visibleTasks}
                  />
                ) : projectView === "board" ? (
                  <div>
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      {searchControl}
                      {filterControl}
                    </div>
                    <div className="grid grid-cols-1 items-start gap-4 pb-6 lg:flex lg:gap-5 lg:overflow-x-auto 2xl:grid 2xl:grid-cols-3">
                      {boardColumns.map((column) => (
                        <BoardColumn
                          canAdd={workspaceView === "project"}
                          column={column}
                          emptyMessage={query.trim() || hasActiveFilters ? "No matching tasks" : undefined}
                          key={column.status}
                          onAdd={openCreate}
                          onDelete={deleteTask}
                          onEdit={openEdit}
                          tasks={visibleTasks.filter((task) => task.status === column.status)}
                        />
                      ))}
                    </div>
                  </div>
                ) : projectView === "list" ? (
                  <div>
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      {searchControl}
                      {filterControl}
                    </div>
                    <TaskListView
                      emptyMessage={query.trim() || hasActiveFilters ? "No matching tasks" : undefined}
                      onDelete={deleteTask}
                      onEdit={openEdit}
                      onStatusChange={changeTaskStatus}
                      tasks={visibleTasks}
                    />
                  </div>
                ) : (
                  <TaskCalendarView
                    key={workspaceView === "my-tasks" ? "my-tasks" : selectedProjectId ?? "no-project"}
                    onDelete={deleteTask}
                    onEdit={openEdit}
                    onStatusChange={changeTaskStatus}
                    tasks={visibleTasks}
                  />
                )}
              </div>
              {hasMoreTasks ? (
                <div className="mt-6 flex justify-center">
                  <button className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm disabled:opacity-50" disabled={loadingMore} onClick={loadMoreTasks} type="button">
                    {loadingMore ? "Loading..." : `Load more tasks (${tasks.length} of ${taskTotal})`}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
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
          projectId={dialog.kind === "edit" ? dialog.task.project.id : selectedProjectId!}
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

      {profileOpen ? (
        <ProfileDialog
          email={userEmail}
          image={profileImage}
          name={profileName}
          onClose={() => setProfileOpen(false)}
          onSaveName={saveProfileName}
          onSaveImage={saveProfileImage}
          onChangePassword={changeProfilePassword}
          onSignOut={signOut}
        />
      ) : null}
    </main>
  );
}
