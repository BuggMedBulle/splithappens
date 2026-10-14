import test from "node:test";
import assert from "node:assert/strict";
import { memoryDatabase } from "./helpers/transaction-memory.mjs";
import { createCreditStore } from "../public/bankboken-multi/credit-card-store.js";
import { createCreditCardSettings, periodForPurchase, periodForMonth, pairCreditBalance, invoiceFeeEntries, summarizeInvoice, invoiceCostShares } from "../public/bankboken-multi/credit-card-model.js";
import { balanceOf } from "../public/bankboken-multi/finance.js";

const settings = createCreditCardSettings("alice", "bob", { enabled: true, cutoffDay: 20 });
const book = { groupType: "pair", memberIds: ["alice", "bob"], members: { alice: { slot: "A" }, bob: { slot: "B" } }, creditCard: settings };
const prefix = "bankbooks/pair/entries/";
const invoiceId = "credit-invoice-2026-10";
function fixture() {
  const memory = memoryDatabase({ "bankbooks/pair": book });
  let now = 100;
  const store = createCreditStore({ ...memory, bookId: "pair", userId: "alice", clock: () => ++now });
  const other = createCreditStore({ ...memory, bookId: "pair", userId: "bob", clock: () => ++now });
  const invoice = () => memory.read(prefix + invoiceId);
  const action = (name, payload = {}) => store.invoiceAction(invoiceId, name, payload, invoice().revision);
  return { memory, store, other, invoice, action };
}
const cardPurchase = (amount = 100, split = "even", extra = {}) => ({
  type: "expense", desc: "Purchase", amount, split, payer: "B", cardMemberId: "bob", paymentSource: "creditCard", purchaseDate: "2026-10-10", ts: Date.parse("2026-10-10T12:00:00Z"), excludedAmount: 0, ...extra,
});
async function reconcile(f) {
  const i = f.invoice();
  await f.action("edit", { actualTotalCents: summarizeInvoice(i, Object.values(i.purchases)).totalCents });
  await f.action("reconcile");
}

test("automatic periods: cutoff inclusion, short months, leap years and year boundaries", () => {
  assert.deepEqual(periodForMonth("2026-10", 20), { month: "2026-10", start: "2026-09-21", end: "2026-10-20" });
  assert.equal(periodForPurchase("2026-10-20", 20).month, "2026-10");
  assert.equal(periodForPurchase("2026-10-21", 20).month, "2026-11");
  assert.deepEqual(periodForMonth("2024-02", 31), { month: "2024-02", start: "2024-02-01", end: "2024-02-29" });
  assert.equal(periodForPurchase("2026-12-31", 20).month, "2027-01");
  assert.equal(periodForPurchase("2026-02-28", 31).month, "2026-02");
  assert.throws(() => periodForPurchase("2026-02-30", 20));
});

test("simultaneous creation/opening results in one invoice and one fee snapshot", async () => {
  const f = fixture();
  await Promise.all(Array.from({ length: 10 }, (_, n) => (n % 2 ? f.store : f.other).ensureInvoice("2026-10")));
  assert.equal(f.memory.values().filter(v => v.kind === "creditInvoice").length, 1);
  assert.equal(f.invoice().feeCents, 57500);
  assert.equal(invoiceFeeEntries([f.invoice()]).length, 1);
  assert.ok(f.memory.retries() > 0);
  await f.store.saveSettings({ ...settings, feeCents: 60000 });
  await f.store.ensureInvoice("2026-10");
  await f.store.ensureInvoice("2026-11");
  assert.equal(f.invoice().feeCents, 57500);
  assert.equal(f.memory.read(prefix + "credit-invoice-2026-11").feeCents, 60000);
});

test("simultaneous purchases and create-only retries keep one record per purchase", async () => {
  const f = fixture();
  await Promise.all([f.store.saveEntry("one", cardPurchase(100), { createOnly: true }), f.other.saveEntry("two", cardPurchase(200), { createOnly: true }), f.other.saveEntry("one", cardPurchase(100), { createOnly: true })]);
  assert.equal(Object.keys(f.invoice().purchases).length, 2);
  assert.equal(summarizeInvoice(f.invoice(), Object.values(f.invoice().purchases)).purchasesCents, 30000);
});

test("required scenario through storage, reconciliation, transfer and Swish", async () => {
  const f = fixture();
  for (const [id, amount, split, holder] of [["food", 2000, "even", "alice"], ["clothes-a", 1500, "a", "alice"], ["restaurant", 1000, "even", "bob"], ["clothes-b", 2500, "b", "bob"], ["gift", 800, "a", "bob"]]) {
    await f.store.saveEntry(id, cardPurchase(amount, split, { cardMemberId: holder }));
  }
  await f.store.saveEntry("private", { type: "expense", payer: "B", amount: 1200, split: "a" });
  let entries = f.memory.values().filter(e => e.type === "expense");
  assert.equal(pairCreditBalance(entries, [f.invoice()], balanceOf), -1200);
  await reconcile(f);
  const revision = f.invoice().revision;
  await Promise.all([f.store.invoiceAction(invoiceId, "transfer", {}, revision), f.other.invoiceAction(invoiceId, "transfer", {}, revision)]);
  assert.equal(Object.keys(f.invoice().transfers).length, 1);
  assert.equal(pairCreditBalance(entries, [f.invoice()], balanceOf), 3087.5);
  await Promise.all([f.store.saveEntry("swish-once", { type: "settlement", payer: "B", amount: 3087.5 }, { createOnly: true }), f.other.saveEntry("swish-once", { type: "settlement", payer: "B", amount: 3087.5 }, { createOnly: true })]);
  entries = f.memory.values().filter(e => ["expense", "settlement"].includes(e.type));
  assert.equal(pairCreditBalance(entries, [f.invoice()], balanceOf), 0);
  await f.action("bankPaid");
  await f.action("bankPaid");
  await f.store.invoiceAction(invoiceId, "transfer", {}, revision);
  assert.equal(pairCreditBalance(entries, [f.invoice()], balanceOf), 0);
  const costs = [...entries.filter(e => e.type === "expense" && e.paymentSource === "creditCard"), ...invoiceFeeEntries([f.invoice()])];
  assert.equal(costs.reduce((sum, e) => sum + e.amount, 0), 8375);
});

test("zero difference is required and stale invoice screens cannot transfer", async () => {
  const f = fixture();
  await f.store.saveEntry("one", cardPurchase());
  await f.action("edit", { actualTotalCents: 1 });
  await assert.rejects(f.action("reconcile"), /invoiceMismatch/);
  await reconcile(f);
  const oldRevision = f.invoice().revision;
  await f.other.saveEntry("two", cardPurchase());
  await assert.rejects(f.store.invoiceAction(invoiceId, "transfer", {}, oldRevision), /staleInvoice/);
  assert.equal(Object.keys(f.invoice().transfers).length, 0);
});

test("traced corrections after Swish preserve old ledger and only post the difference", async () => {
  const f = fixture();
  await f.store.saveEntry("one", cardPurchase());
  await reconcile(f); await f.action("transfer");
  const originalLedger = structuredClone(f.invoice().transfers);
  await f.store.saveEntry("swish", { type: "settlement", payer: "B", amount: 337.5 });
  await assert.rejects(f.store.saveEntry("one", { amount: 200 }), /correctionReasonRequired/);
  await f.store.saveEntry("one", { amount: 200 }, { reason: "Missing item", expectedVersion: 1 });
  assert.deepEqual(f.invoice().transfers, originalLedger);
  let entries = f.memory.values().filter(e => ["expense", "settlement"].includes(e.type));
  assert.equal(pairCreditBalance(entries, [f.invoice()], balanceOf), 0);
  await f.action("edit", { actualTotalCents: 77500, reason: "Correct statement" });
  await f.action("reconcile");
  await f.action("transfer", { reason: "Missing item" });
  assert.equal(pairCreditBalance(entries, [f.invoice()], balanceOf), 50);
  assert.equal(Object.values(f.invoice().transfers).at(-1).cents, 5000);
  await assert.rejects(f.store.saveEntry("one", {}, { remove: true }), /correctionReasonRequired/);
  await f.store.saveEntry("one", {}, { remove: true, reason: "Cancelled purchase" });
  await f.action("edit", { actualTotalCents: 57500, reason: "Cancelled" });
  await f.action("reconcile"); await f.action("transfer", { reason: "Cancelled" });
  entries = f.memory.values().filter(e => ["expense", "settlement"].includes(e.type));
  assert.equal(pairCreditBalance(entries, [f.invoice()], balanceOf), -50);
});

test("manual invoice move updates both periods atomically and receipt metadata leaves reconciliation intact", async () => {
  const f = fixture();
  await f.store.saveEntry("one", cardPurchase());
  await f.store.saveEntry("one", { manualInvoiceMonth: "2026-11" }, { expectedVersion: 1 });
  assert.equal(Object.keys(f.invoice().purchases).length, 0);
  const november = f.memory.read(prefix + "credit-invoice-2026-11");
  assert.equal(november.purchases.one.amount, 100);
  await f.store.invoiceAction(november.id, "edit", { actualTotalCents: 67500 }, november.revision);
  await f.store.invoiceAction(november.id, "reconcile", {}, november.revision + 1);
  await f.store.saveEntry("one", { hasReceipt: true });
  assert.equal(f.memory.read(prefix + november.id).status, "reconciled");
  await assert.rejects(f.store.saveEntry("one", { amount: 500 }, { expectedVersion: 1 }), /staleInvoice/);
});

test("retrospective refunds and excluded receipt costs remain fully allocated", async () => {
  const f = fixture();
  await f.store.saveEntry("one", cardPurchase(100, "even", { excludedAmount: 20, excludedCostMemberId: "alice" }));
  assert.deepEqual(invoiceCostShares(f.invoice().purchases.one, f.invoice()), { a: 6000, b: 4000 });
  await f.store.saveEntry("refund", cardPurchase(-100, "even", { excludedAmount: 20, excludedCostMemberId: "alice" }));
  assert.equal(summarizeInvoice(f.invoice(), Object.values(f.invoice().purchases)).purchasesCents, 0);
});

test("private expenses and recurring templates do not create credit invoices", async () => {
  const f = fixture();
  await f.store.saveEntry("private", { type: "expense", amount: 100, payer: "A", split: "even" });
  await f.store.saveEntry("template", { kind: "recurringTemplate", paymentSource: "creditCard", startDate: "2026-10-10" });
  assert.equal(f.invoice(), undefined);
  await f.store.saveEntry("recurring-once", cardPurchase(), { createOnly: true });
  await f.other.saveEntry("recurring-once", cardPurchase(), { createOnly: true });
  assert.equal(Object.keys(f.invoice().purchases).length, 1);
});

test("repeated reconciliation of a settled invoice is harmless and payer changes are explicit corrections", async () => {
  const f = fixture();
  await f.store.saveEntry("one", cardPurchase(100, "even"));
  await reconcile(f); await f.action("transfer");
  const ledger = structuredClone(f.invoice().transfers);
  await f.action("reconcile");
  assert.equal(f.invoice().status, "transferred");
  assert.deepEqual(f.invoice().transfers, ledger);
  await assert.rejects(f.action("edit", { invoicePayerMemberId: "bob" }), /correctionReasonRequired/);
  await f.action("edit", { invoicePayerMemberId: "bob", reason: "Bob paid the actual invoice" });
  await f.action("reconcile"); await f.action("transfer", { reason: "Correct actual payer" });
  assert.equal(Object.values(f.invoice().transfers).reduce((sum, e) => sum + e.cents, 0), -33750);
  assert.equal(f.invoice().audit[Object.keys(f.invoice().audit).find(key => key.startsWith("edit-3"))]?.before.invoicePayerMemberId, "alice");
});

test("disabled accounts preserve old invoices but reject new purchases and period creation", async () => {
  const f = fixture();
  await f.store.saveEntry("one", cardPurchase());
  await f.store.saveSettings({ ...settings, enabled: false });
  await assert.rejects(f.store.saveEntry("new", cardPurchase()), /creditDisabled/);
  await assert.rejects(f.store.ensureInvoice("2026-11"), /creditDisabled/);
  await f.store.saveEntry("one", { amount: 200 });
  assert.equal(f.invoice().purchases.one.amount, 200);
});

test("editing dates updates the automatic period, while manual periods remain explicit", async () => {
  const f = fixture();
  await f.store.saveEntry("one", cardPurchase());
  await f.store.saveEntry("one", { purchaseDate: "2026-10-21", ts: Date.parse("2026-10-21T12:00:00Z") });
  assert.equal(Object.keys(f.invoice().purchases).length, 0);
  assert.ok(f.memory.read(prefix + "credit-invoice-2026-11").purchases.one);
  await f.store.saveEntry("one", { manualInvoiceMonth: "2026-10" });
  assert.ok(f.invoice().purchases.one);
  assert.equal(Object.keys(f.memory.read(prefix + "credit-invoice-2026-11").purchases).length, 0);
});

test("subscription category changes apply to future private and card expenses, including stale generators", async () => {
  for (const paymentSource of ["private", "creditCard"]) {
    const f = fixture();
    await f.store.saveEntry("subscription", { kind: "recurringTemplate", icon: "🧾", active: true, paymentSource });
    const fields = { ...cardPurchase(100), paymentSource, recurringId: "subscription", icon: "🧾" };
    await f.store.saveEntry("first-month", fields, { createOnly: true });
    await f.store.saveEntry("subscription", { icon: "📺" });
    await f.other.saveEntry("second-month", fields, { createOnly: true });
    assert.equal(f.memory.read(prefix + "first-month").icon, "🧾");
    assert.equal(f.memory.read(prefix + "second-month").icon, "📺");
    assert.equal(f.memory.read(prefix + "second-month").amount, 100);
    if (paymentSource === "creditCard") assert.equal(f.invoice().purchases["second-month"].icon, "📺");
    await f.store.saveEntry("subscription", {}, { remove: true });
    assert.equal(await f.other.saveEntry("after-stop", fields, { createOnly: true }), null);
    assert.equal(f.memory.read(prefix + "after-stop"), undefined);
  }
});
