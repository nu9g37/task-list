export type ProjectColor = "indigo" | "emerald" | "amber" | "rose" | "sky";

export type Project = {
  id: string;
  name: string;
  description: string;
  color: ProjectColor;
  taskCount: number;
};
