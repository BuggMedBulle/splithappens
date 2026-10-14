import vm from "node:vm";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";
import { balanceOf, sharesOf, groupNetBalances, optimizedSwishPlan } from "../public/bankboken-multi/finance.js";

test("500 deterministic scenarios retain the original release's financial behavior", () => {
  // Read the immutable pre-extraction code from Git rather than maintaining a
  // second copy of the implementation in the tests.
  const baseline = execFileSync("git", ["show", "b8414ec:public/bankboken-multi/app.js"], {
    cwd: new URL("../", import.meta.url), encoding: "utf8",
  });
  const profiles = [["alice", { slot: "A" }], ["bob", { slot: "B" }], ["carol", { slot: "C" }]];
  const original = vm.createContext({ activeGroupProfiles: () => profiles });
  const extract = (start, end) => {
    const startIndex = baseline.indexOf(start);
    const endIndex = baseline.indexOf(end, startIndex);
    assert.ok(startIndex >= 0 && endIndex > startIndex);
    return baseline.slice(startIndex, endIndex);
  };
  vm.runInContext(
    extract("function sharesOf(", "function groupExperienceType(")
    + extract("function profileUidForSlot(", "function applyExperienceMode(")
    + extract("function groupNetBalances(", "const locale ="), original,
  );
  let seed = 1729;
  const random = max => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % max; };
  for (let caseIndex = 0; caseIndex < 500; caseIndex++) {
    const entries = Array.from({ length: 1 + random(10) }, () => {
      const type = ["expense", "income", "settlement"][random(3)];
      const payer = ["A", "B"][random(2)];
      return {
        type, payer, amount: random(100000) / 100,
        split: ["a", "b", "even", "custom"][random(4)], shareA: random(101) / 100,
        ...(type !== "settlement" && random(2) === 1 ? {
          payerUid: payer === "A" ? "alice" : "bob", participantUids: ["alice", "bob", "carol"],
        } : {}),
      };
    });
    assert.equal(balanceOf(entries), original.balanceOf(entries), `pair scenario ${caseIndex}`);
    assert.equal(JSON.stringify(groupNetBalances(entries, profiles)), JSON.stringify(original.groupNetBalances(entries)), `group scenario ${caseIndex}`);
    assert.equal(JSON.stringify(optimizedSwishPlan(entries, profiles)), JSON.stringify(original.optimizedSwishPlan(entries)), `Swish scenario ${caseIndex}`);
    for (const entry of entries) assert.equal(JSON.stringify(sharesOf(entry)), JSON.stringify(original.sharesOf(entry)));
  }
});
