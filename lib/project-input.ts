import type { ProjectColor } from "@/app/_types/project";

const projectColors = new Set<ProjectColor>([
  "indigo",
  "emerald",
  "amber",
  "rose",
  "sky",
]);

export type ProjectInput = {
  name: string;
  description: string;
  color: ProjectColor;
};

export function parseProjectInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { success: false as const, error: "Request body must be an object." };
  }

  const input = value as Record<string, unknown>;
  if (typeof input.name !== "string" || !input.name.trim()) {
    return { success: false as const, error: "Project name is required." };
  }
  if (input.description !== undefined && typeof input.description !== "string") {
    return { success: false as const, error: "Description must be text." };
  }
  if (typeof input.color !== "string" || !projectColors.has(input.color as ProjectColor)) {
    return { success: false as const, error: "Invalid project color." };
  }

  return {
    success: true as const,
    data: {
      name: input.name.trim().slice(0, 80),
      description: (input.description ?? "").trim().slice(0, 500),
      color: input.color as ProjectColor,
    },
  };
}
