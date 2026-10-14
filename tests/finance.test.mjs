import assert from "node:assert/strict";
import test from "node:test";
import { sharesOf, balanceOf, groupNetBalances, optimizedSwishPlan } from "../public/bankboken-multi/finance.js";

const profiles = [
  ["alice", { slot: "A" }], ["bob", { slot: "B" }], ["carol", { slot: "C" }],
];
const pairProfiles = profiles.slice(0, 2);
const expense = (payer, amount, split = "even", extra = {}) => ({ type: "expense", payer, amount, split, ...extra });

test("private expenses: both payers and all existing pair split modes", () => {
  for (const [split, shareA, expected] of [["even", undefined, 50], ["a", undefined, 0], ["b", undefined, 100], ["custom", 0.3, 70]]) {
    assert.equal(balanceOf([expense("A", 100, split, { shareA })]), expected);
    assert.equal(balanceOf([expense("B", 100, split, { shareA })]), expected - 100);
  }
});

test("receipt exclusions and custom proportions preserve existing behavior", () => {
  assert.deepEqual(sharesOf(expense("A", 100, "even", { excludedAmount: 20 })), { a: 40, b: 40 });
  assert.equal(balanceOf([expense("A", 100, "custom", { shareA: 0.25, excludedAmount: 20 })]), 60);
  assert.deepEqual(sharesOf(expense("A", 100, "custom", { shareA: 2 })), { a: 100, b: 0 });
  assert.deepEqual(sharesOf(expense("A", 100, "even", { excludedAmount: 200 })), { a: 0, b: 0 });
});

test("income, private expenses and Swish offset in the existing signed balance", () => {
  const entries = [expense("A", 1000), expense("B", 200), { type: "income", payer: "A", amount: 200, split: "even" }];
  assert.equal(balanceOf(entries), 300);
  assert.equal(balanceOf([...entries, { type: "settlement", payer: "B", amount: 300 }]), 0);
  assert.equal(balanceOf([expense("B", 1000), { type: "settlement", payer: "A", amount: 500 }]), 0);
});

test("group equal split preserves every cent, including amounts not divisible by three", () => {
  const entries = [expense("A", 100, "even", { payerUid: "alice", participantUids: ["alice", "bob", "carol"] })];
  assert.deepEqual(groupNetBalances(entries, profiles), [
    { uid: "alice", cents: 6666 }, { uid: "bob", cents: -3333 }, { uid: "carol", cents: -3333 },
  ]);
  assert.equal(groupNetBalances(entries, profiles).reduce((sum, b) => sum + b.cents, 0), 0);
});

test("group payer can front costs only for selected other people", () => {
  const entries = [expense("A", 120, "even", { payerUid: "alice", participantUids: ["bob", "carol"] })];
  assert.deepEqual(groupNetBalances(entries, profiles), [
    { uid: "alice", cents: 12000 }, { uid: "bob", cents: -6000 }, { uid: "carol", cents: -6000 },
  ]);
});

test("legacy pair entries remain compatible with group net balances", () => {
  assert.deepEqual(groupNetBalances([expense("A", 100, "custom", { shareA: 0.3 })], pairProfiles), [
    { uid: "alice", cents: 7000 }, { uid: "bob", cents: -7000 },
  ]);
  assert.deepEqual(groupNetBalances([expense("A", 100), { type: "settlement", payer: "B", amount: 50 }], pairProfiles), []);
});

test("group income reverses the appropriate shares", () => {
  const entries = [{ type: "income", payer: "B", payerUid: "bob", amount: 90, participantUids: ["alice", "bob", "carol"] }];
  assert.deepEqual(groupNetBalances(entries, profiles), [
    { uid: "alice", cents: 3000 }, { uid: "bob", cents: -6000 }, { uid: "carol", cents: 3000 },
  ]);
});

test("optimized Swish settles the full group in the minimal number of payments", () => {
  const entries = [expense("A", 90, "even", { payerUid: "alice", participantUids: ["alice", "bob", "carol"] }), expense("B", 30, "even", { payerUid: "bob", participantUids: ["alice", "bob"] })];
  const before = JSON.stringify(entries);
  const plan = optimizedSwishPlan(entries, profiles);
  assert.equal(plan.length, 2);
  assert.deepEqual(plan, [
    { fromUid: "bob", toUid: "alice", amount: 15 },
    { fromUid: "carol", toUid: "alice", amount: 30 },
  ]);
  const settled = [...entries, ...plan.map((p) => ({ type: "settlement", payerUid: p.fromUid, recipientUid: p.toUid, amount: p.amount }))];
  assert.deepEqual(groupNetBalances(settled, profiles), []);
  assert.deepEqual(optimizedSwishPlan(settled, profiles), []);
  assert.equal(JSON.stringify(entries), before);
});

test("group computation is independent of entry order and ignores unknown payers", () => {
  const entries = [expense("A", 100), expense("B", 60), { type: "settlement", payer: "B", amount: 10 }];
  assert.deepEqual(groupNetBalances(entries, pairProfiles), groupNetBalances([...entries].reverse(), pairProfiles));
  assert.deepEqual(groupNetBalances([expense("A", 10, "even", { payerUid: "unknown" })], pairProfiles), []);
});
