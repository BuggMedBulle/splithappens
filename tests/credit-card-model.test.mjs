import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateCents, createCreditCardSettings, summarizeInvoice,
  previewInvoiceContribution, netPairBalanceCents, toCents, pendingCreditBalance, pairCreditBalance, periodForPurchase,
} from "../public/bankboken-multi/credit-card-model.js";
import { balanceOf } from "../public/bankboken-multi/finance.js";

const baseInvoice = {
  id: "2026-10", accountId: "shared", memberAId: "alice", memberBId: "bob",
  invoicePayerMemberId: "alice", feeCents: 57500, feeShareA: 0.5,
  status: "reconciled", actualTotalCents: 837500, transferredAt: null,
};
const purchase = (id, amount, cardMemberId, split, shareA) => ({
  id, amount, cardMemberId, split, ...(shareA == null ? {} : { shareA }),
  paymentSource: "creditCard", accountId: "shared", invoiceId: "2026-10",
});
const purchases = [
  purchase("groceries", 2000, "alice", "even"),
  purchase("clothes-a", 1500, "alice", "a"),
  purchase("restaurant", 1000, "bob", "even"),
  purchase("clothes-b", 2500, "bob", "b"),
  purchase("gift-a", 800, "bob", "a"),
];

test("required acceptance scenario: costs, fee, responsibilities and net Swish amount", () => {
  const result = summarizeInvoice(baseInvoice, purchases);
  assert.equal(result.purchasesCents, 780000);
  assert.equal(result.feeCents, 57500);
  assert.equal(result.totalCents, 837500);
  assert.deepEqual(result.sharesCents, { a: 408750, b: 428750 });
  assert.deepEqual(result.byCardCents, { alice: 350000, bob: 430000 });
  assert.equal(result.differenceCents, 0);
  const privateEntries = [{ type: "expense", payer: "B", amount: 1200, split: "a" }];
  assert.equal(balanceOf(privateEntries), -1200);
  const contribution = previewInvoiceContribution(baseInvoice, purchases);
  assert.equal(contribution, 428750);
  assert.equal(netPairBalanceCents(balanceOf(privateEntries), [contribution]), 308750);
  const afterSwish = [...privateEntries, { type: "settlement", payer: "B", amount: 3087.5 }];
  assert.equal(netPairBalanceCents(balanceOf(afterSwish), [contribution]), 0);
});

test("card holder has no influence on cost responsibility", () => {
  const flipped = purchases.map(p => ({ ...p, cardMemberId: p.cardMemberId === "alice" ? "bob" : "alice" }));
  assert.deepEqual(summarizeInvoice(baseInvoice, flipped).sharesCents, { a: 408750, b: 428750 });
});

test("defaults are optional, require a configured cutoff, and can be changed", () => {
  const settings = createCreditCardSettings("alice", "bob");
  assert.equal(settings.enabled, false);
  assert.equal(settings.cutoffDay, null);
  assert.equal(settings.invoicePayerMemberId, "alice");
  assert.equal(settings.feeCents, 57500);
  assert.deepEqual(allocateCents(settings.feeCents, settings.feeShareA), { a: 28750, b: 28750 });
  const updated = createCreditCardSettings("alice", "bob", { enabled: true, cutoffDay: 31, feeCents: 60000, feeShareA: 0.25, invoicePayerMemberId: "bob" });
  assert.equal(updated.feeCents, 60000);
  assert.equal(settings.feeCents, 57500);
  assert.throws(() => createCreditCardSettings("alice", "alice"));
  assert.throws(() => createCreditCardSettings("alice", "bob", { cutoffDay: 0 }));
  assert.throws(() => createCreditCardSettings("alice", "bob", { cutoffDay: 1.5 }));
  assert.throws(() => createCreditCardSettings("alice", "bob", { invoicePayerMemberId: "eve" }));
});

test("fee is a snapshot and repeated calculations do not mutate or add costs", () => {
  const before = JSON.stringify({ baseInvoice, purchases });
  const first = summarizeInvoice(baseInvoice, purchases);
  for (let i = 0; i < 5; i++) assert.deepEqual(summarizeInvoice(baseInvoice, purchases), first);
  createCreditCardSettings("alice", "bob", { feeCents: 90000 });
  assert.equal(summarizeInvoice(baseInvoice, purchases).feeCents, 57500);
  assert.equal(JSON.stringify({ baseInvoice, purchases }), before);
});

test("missing actual amount, mismatches, unfinished or already transferred invoices cannot produce a transfer preview", () => {
  for (const change of [{ actualTotalCents: null }, { actualTotalCents: 837501 }, { status: "ongoing" }, { status: "received" }, { status: "transferred" }, { transferredAt: 123 }]) {
    assert.throws(() => previewInvoiceContribution({ ...baseInvoice, ...change }, purchases));
  }
  assert.equal(summarizeInvoice({ ...baseInvoice, actualTotalCents: 837501 }, purchases).differenceCents, 1);
});

test("actual payer B reverses the correct responsibility, not the physical cards", () => {
  assert.equal(previewInvoiceContribution({ ...baseInvoice, invoicePayerMemberId: "bob" }, purchases), -408750);
});

test("refunds reverse the original split exactly, including an odd cent", () => {
  assert.deepEqual(allocateCents(101, 0.5), { a: 51, b: 50 });
  assert.deepEqual(allocateCents(-101, 0.5), { a: -51, b: -50 });
  const invoice = { ...baseInvoice, feeCents: 0, actualTotalCents: 0 };
  const lines = [purchase("sale", 1.01, "bob", "even"), purchase("refund", -1.01, "alice", "even")];
  assert.deepEqual(summarizeInvoice(invoice, lines).sharesCents, { a: 0, b: 0 });
  assert.equal(previewInvoiceContribution(invoice, lines), 0);
});

test("custom split and changed invoice fee preserve every cent", () => {
  const invoice = { ...baseInvoice, feeCents: 101, feeShareA: 0.25, actualTotalCents: 201 };
  const summary = summarizeInvoice(invoice, [purchase("custom", 1, "bob", "custom", 0.3)]);
  assert.deepEqual(summary.sharesCents, { a: 55, b: 146 });
  assert.equal(summary.sharesCents.a + summary.sharesCents.b, summary.totalCents);
});

test("cross-invoice input, duplicates, invalid money and incomplete allocation fail explicitly", () => {
  const first = purchases[0];
  for (const lines of [[first, first], [{ ...first, invoiceId: "other" }], [{ ...first, accountId: "other" }], [{ ...first, paymentSource: "private" }], [{ ...first, cardMemberId: "eve" }], [{ ...first, amount: NaN }], [{ ...first, split: "custom", shareA: 2 }], [{ ...first, excludedAmount: 100 }]]) {
    assert.throws(() => summarizeInvoice(baseInvoice, lines));
  }
  assert.throws(() => toCents(Infinity));
  assert.throws(() => allocateCents(1.5, 0.5));
  assert.throws(() => allocateCents(100, -0.1));
  assert.equal(toCents(1.005), 101);
  assert.equal(toCents(-1.005), -101);
  assert.equal(toCents(10.075), 1008);
  assert.equal(toCents(-10.075), -1008);
  assert.equal(toCents(1e-7), 0);
  assert.throws(() => toCents(1e20));
  assert.throws(() => summarizeInvoice({ ...baseInvoice, memberAId: null }, purchases));
});


test("bank payment metadata does not change responsibility or create costs", () => {
  const paid = { ...baseInvoice, bankPaidAt: 123, bankPaymentAmountCents: 837500 };
  assert.deepEqual(summarizeInvoice(paid, purchases), summarizeInvoice(baseInvoice, purchases));
  assert.equal(previewInvoiceContribution(paid, purchases), 428750);
});

test("refund-only and fee-only invoices conserve their totals", () => {
  const refundInvoice = { ...baseInvoice, feeCents: 0, actualTotalCents: -10000 };
  assert.equal(previewInvoiceContribution(refundInvoice, [purchase("return", -100, "bob", "b")]), -10000);
  const feeInvoice = { ...baseInvoice, actualTotalCents: 57500 };
  assert.deepEqual(summarizeInvoice(feeInvoice, []).sharesCents, { a: 28750, b: 28750 });
});


test("upcoming debt moves into payable once and subsequent refunds show only their correction", () => {
  const invoice = { ...baseInvoice, purchases: Object.fromEntries(purchases.map(p => [p.id, p])) };
  const privateEntries = [{ type: "expense", payer: "B", amount: 1200, split: "a" }];
  const before = pairCreditBalance(privateEntries, [invoice], balanceOf);
  assert.equal(before, -1200);
  assert.equal(pendingCreditBalance([invoice]), 4287.5);
  invoice.transfers = { r0: { cents: 428750 } };
  assert.equal(pendingCreditBalance([invoice]), 0);
  assert.equal(pairCreditBalance(privateEntries, [invoice], balanceOf), before + 4287.5);
  invoice.purchases.refund = purchase("refund", -200, "bob", "even");
  assert.equal(pendingCreditBalance([invoice]), -100);
  invoice.transfers.r1 = { cents: -10000 };
  assert.equal(pendingCreditBalance([invoice]), 0);
});

test("upcoming responsibility follows invoice payer, including fee-only invoices", () => {
  const invoice = { ...baseInvoice, purchases: {}, actualTotalCents: null };
  assert.equal(pendingCreditBalance([invoice]), 287.5);
  invoice.invoicePayerMemberId = "bob";
  assert.equal(pendingCreditBalance([invoice]), -287.5);
  assert.equal(pendingCreditBalance([]), 0);
});

test("cutoff 3 places October 14 in the October 4–November 3 period", () => {
  assert.deepEqual(periodForPurchase("2026-10-14", 3), { month: "2026-11", start: "2026-10-04", end: "2026-11-03" });
  assert.equal(periodForPurchase("2026-10-03", 3).month, "2026-10");
});
