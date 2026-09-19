import assert from "node:assert/strict";
import test from "node:test";
import { createWithUniqueTaskCode, isTaskCodeCollision, newTaskCode } from "../lib/tasks/code";

test("task codes use 12 hex characters and vary", () => {
  const codes = new Set(Array.from({ length: 1000 }, newTaskCode));
  assert.equal(codes.size, 1000);
  for (const code of codes) assert.match(code, /^TSK-[0-9A-F]{12}$/);
});

test("retries only a unique conflict on the code field", async () => {
  const tried: string[] = [];
  const result = await createWithUniqueTaskCode(async (code) => {
    tried.push(code);
    if (tried.length === 1) throw { code: "P2002", meta: { target: ["code"] } };
    return code;
  }, () => ["TSK-FIRST", "TSK-SECOND"][tried.length]);
  assert.equal(result, "TSK-SECOND");
  assert.deepEqual(tried, ["TSK-FIRST", "TSK-SECOND"]);
  assert.equal(isTaskCodeCollision({ code: "P2002", meta: { target: ["other"] } }), false);
});

test("does not retry unrelated database errors and stops after limit", async () => {
  let calls = 0;
  await assert.rejects(createWithUniqueTaskCode(async () => {
    calls++;
    throw { code: "P2002", meta: { target: ["email"] } };
  }), { code: "P2002" });
  assert.equal(calls, 1);
  await assert.rejects(createWithUniqueTaskCode(async () => {
    calls++;
    throw { code: "P2002", meta: { target: ["code"] } };
  }, () => "TSK-SAME", 3), { code: "P2002" });
  assert.equal(calls, 4);
});
