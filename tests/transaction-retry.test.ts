import assert from "node:assert/strict";
import test from "node:test";
import { retryWriteConflict } from "../lib/transaction-retry";

test("retries serializable write conflicts", async () => {
  let calls = 0;
  const value = await retryWriteConflict(async () => {
    calls++;
    if (calls < 3) throw { code: "P2034" };
    return "updated";
  });
  assert.equal(value, "updated");
  assert.equal(calls, 3);
});

test("does not hide non-conflict failures or retry forever", async () => {
  let calls = 0;
  await assert.rejects(retryWriteConflict(async () => {
    calls++;
    throw { code: "P2025" };
  }), { code: "P2025" });
  assert.equal(calls, 1);
  await assert.rejects(retryWriteConflict(async () => {
    calls++;
    throw { code: "P2034" };
  }, 2), { code: "P2034" });
  assert.equal(calls, 3);
});
