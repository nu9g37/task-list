import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskWhere } from "../lib/tasks/filter";
import { parseTaskPage } from "../lib/tasks/page";

test("assigned to me and assignee filter both apply", () => {
  const page = parseTaskPage(new URLSearchParams("assigneeId=teammate&priority=HIGH"));
  assert.ok(page);
  assert.deepEqual(buildTaskWhere("me", undefined, true, page), {
    AND: [
      { project: { members: { some: { userId: "me" } } } },
      { assignees: { some: { userId: "me" } } },
      { priority: "HIGH" },
      { assignees: { some: { userId: { in: ["teammate"] } } } },
    ],
  });
});
