import { randomUUID } from "node:crypto";

export function newTaskCode() {
  return `TSK-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

export function isTaskCodeCollision(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== "P2002") {
    return false;
  }
  const target = "meta" in error && error.meta && typeof error.meta === "object" && "target" in error.meta
    ? error.meta.target
    : undefined;
  return Array.isArray(target) && target.includes("code");
}

export async function createWithUniqueTaskCode<T>(
  create: (code: string) => Promise<T>,
  generateCode: () => string = newTaskCode,
  attempts = 5,
): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await create(generateCode());
    } catch (error) {
      if (!isTaskCodeCollision(error) || attempt === attempts - 1) throw error;
    }
  }
  throw new Error("Unable to generate a unique task code.");
}
