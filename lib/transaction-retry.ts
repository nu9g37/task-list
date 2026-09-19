export async function retryWriteConflict<T>(operation: () => Promise<T>, attempts = 5): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isConflict = error && typeof error === "object" && "code" in error && error.code === "P2034";
      if (!isConflict || attempt === attempts - 1) throw error;
    }
  }
  throw new Error("Unable to complete transaction.");
}
