import type {
  TaskPriority,
  TaskStatus,
} from "@/app/generated/prisma/client";

const statuses = new Set<TaskStatus>(["TODO", "IN_PROGRESS", "DONE"]);
const priorities = new Set<TaskPriority>(["LOW", "MEDIUM", "HIGH"]);

export type TaskInput = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  tag?: string;
  assigneeInitials?: string;
};

type ParseResult =
  | { success: true; data: TaskInput }
  | { success: false; error: string };

export function parseTaskInput(value: unknown, requireTitle: boolean): ParseResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false, error: "Request body must be an object." };
  }

  const body = value as Record<string, unknown>;
  const data: TaskInput = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return { success: false, error: "Title is required." };
    }
    data.title = body.title.trim().slice(0, 160);
  } else if (requireTitle) {
    return { success: false, error: "Title is required." };
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { success: false, error: "Description must be text." };
    }
    data.description = body.description.trim().slice(0, 1000);
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !statuses.has(body.status as TaskStatus)) {
      return { success: false, error: "Invalid task status." };
    }
    data.status = body.status as TaskStatus;
  }

  if (body.priority !== undefined) {
    if (
      typeof body.priority !== "string" ||
      !priorities.has(body.priority as TaskPriority)
    ) {
      return { success: false, error: "Invalid task priority." };
    }
    data.priority = body.priority as TaskPriority;
  }

  if (body.dueDate !== undefined) {
    if (body.dueDate === null || body.dueDate === "") {
      data.dueDate = null;
    } else if (typeof body.dueDate === "string") {
      const date = new Date(`${body.dueDate}T12:00:00.000Z`);
      if (Number.isNaN(date.getTime())) {
        return { success: false, error: "Invalid due date." };
      }
      data.dueDate = date;
    } else {
      return { success: false, error: "Invalid due date." };
    }
  }

  if (body.tag !== undefined) {
    if (typeof body.tag !== "string" || !body.tag.trim()) {
      return { success: false, error: "Tag is required." };
    }
    data.tag = body.tag.trim().slice(0, 40);
  }

  if (body.assigneeInitials !== undefined) {
    if (typeof body.assigneeInitials !== "string" || !body.assigneeInitials.trim()) {
      return { success: false, error: "Assignee initials are required." };
    }
    data.assigneeInitials = body.assigneeInitials.trim().toUpperCase().slice(0, 3);
  }

  return { success: true, data };
}
