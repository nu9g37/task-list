export function wouldRemoveLastOwner(targetRole: "OWNER" | "MEMBER", nextRole: "OWNER" | "MEMBER" | null, ownerCount: number) {
  return targetRole === "OWNER" && nextRole !== "OWNER" && ownerCount <= 1;
}
