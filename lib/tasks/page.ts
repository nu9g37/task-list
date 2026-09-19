export const TASK_PAGE_SIZE = 40;

export function parseTaskPage(params: URLSearchParams) {
  const rawPage = params.get("page") ?? "1";
  const page = Number(rawPage);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return null;
  const priority = params.get("priority");
  if (priority && !["LOW", "MEDIUM", "HIGH"].includes(priority)) return null;
  const search = (params.get("search") ?? "").trim();
  if (search.length > 160) return null;
  const assigneeIds = params.getAll("assigneeId");
  if (assigneeIds.length > 100 || assigneeIds.some((id) => !id || id.length > 100)) return null;
  return { page, skip: (page - 1) * TASK_PAGE_SIZE, priority, search, assigneeIds };
}
