import type { Task, TaskPriority } from "@/app/_types/task";

type TaskApiResponse = Omit<Task, "dueDate"> & { dueDate: string | null };
type TaskPageResponse = { items: TaskApiResponse[]; total: number; hasMore: boolean };

export type WorkspaceView = "project" | "my-tasks" | "calendar" | "overview";

export function toTask(value: TaskApiResponse): Task {
  return { ...value, dueDate: value.dueDate ?? undefined };
}

export async function readApiError(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Something went wrong. Please try again.";
}

export function taskPageUrl(
  view: WorkspaceView,
  projectId: string | null,
  page: number,
  query: string,
  priority: TaskPriority | null,
  assigneeIds: string[],
) {
  const params = new URLSearchParams({ page: String(page) });
  if (view === "project" && projectId) params.set("projectId", projectId);
  if (view === "my-tasks") params.set("assignedToMe", "true");
  if (view === "overview" || view === "calendar") params.set("allProjects", "true");
  if (query.trim()) params.set("search", query.trim());
  if (priority) params.set("priority", priority);
  for (const id of assigneeIds) params.append("assigneeId", id);
  return `/api/tasks?${params}`;
}

export async function readTaskPage(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(await readApiError(response));
  const data = (await response.json()) as TaskPageResponse;
  return { tasks: data.items.map(toTask), total: data.total, hasMore: data.hasMore };
}
