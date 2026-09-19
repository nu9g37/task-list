import assert from "node:assert/strict";
import test from "node:test";
import { wouldRemoveLastOwner } from "../lib/owner-guard";

test("last owner cannot be demoted or removed", () => {
  assert.equal(wouldRemoveLastOwner("OWNER", "MEMBER", 1), true);
  assert.equal(wouldRemoveLastOwner("OWNER", null, 1), true);
  assert.equal(wouldRemoveLastOwner("OWNER", "MEMBER", 2), false);
  assert.equal(wouldRemoveLastOwner("MEMBER", null, 1), false);
  assert.equal(wouldRemoveLastOwner("OWNER", "OWNER", 1), false);
});
