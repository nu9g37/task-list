import assert from "node:assert/strict";
import test from "node:test";
import { TASK_PAGE_SIZE, parseTaskPage } from "../lib/tasks/page";

test("task page defaults and offsets are stable", () => {
  assert.deepEqual(parseTaskPage(new URLSearchParams()), {
    page: 1, skip: 0, priority: null, search: "", assigneeIds: [],
  });
  assert.equal(parseTaskPage(new URLSearchParams("page=3"))?.skip, 2 * TASK_PAGE_SIZE);
});

test("task page rejects invalid inputs", () => {
  for (const query of ["page=0", "page=1.5", "page=abc", "priority=URGENT", "page=10001"]) {
    assert.equal(parseTaskPage(new URLSearchParams(query)), null);
  }
  assert.equal(parseTaskPage(new URLSearchParams(`search=${"a".repeat(161)}`)), null);
});
