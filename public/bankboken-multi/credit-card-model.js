// Session 1 foundation only. This module does not write to Firestore or activate UI.
// All derived money is integer cents; existing purchase amounts remain SEK.
export const CREDIT_CARD_DEFAULTS = Object.freeze({
  enabled: false,
  name: "Gemensamt kreditkort",
  feeCents: 57500,
  feeShareA: 0.5,
  cutoffDay: null, // Must be explicitly configured; no bank cutoff is assumed.
});

function integerCents(value, label = "amountCents") {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be integer cents`);
  return value;
}

export function toCents(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError("Amount must be a finite number");
  }
  const [coefficient, exponent = "0"] = String(Math.abs(amount)).split("e");
  const shifted = Number(`${coefficient}e${Number(exponent) + 2}`);
  return integerCents(Math.sign(amount) * Math.round(shifted)) || 0;
}

function ratio(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError("Cost share must be between 0 and 1");
  }
  return value;
}

export function allocateCents(amountCents, shareA) {
  integerCents(amountCents);
  ratio(shareA);
  // Refunds reverse the original allocation, including odd-cent rounding.
  const a = Math.sign(amountCents) * Math.round(Math.abs(amountCents) * shareA);
  return { a: a || 0, b: amountCents - a };
}

function purchaseRatio(purchase) {
  if (purchase.split === "a") return 1;
  if (purchase.split === "b") return 0;
  if (purchase.split === "custom") return ratio(purchase.shareA);
  if (purchase.split === "even") return 0.5;
  throw new TypeError("Unknown cost split");
}

export function createCreditCardSettings(memberAId, memberBId, overrides = {}) {
  if (!memberAId || !memberBId || memberAId === memberBId) {
    throw new TypeError("Two distinct stable member IDs are required");
  }
  const settings = {
    ...CREDIT_CARD_DEFAULTS,
    primaryCardMemberId: memberAId,
    extraCardMemberId: memberBId,
    invoicePayerMemberId: memberAId,
    ...overrides,
  };
  integerCents(settings.feeCents, "feeCents");
  if (settings.feeCents < 0) throw new RangeError("Default fee cannot be negative");
  ratio(settings.feeShareA);
  if (settings.cutoffDay !== null && (!Number.isInteger(settings.cutoffDay) || settings.cutoffDay < 1 || settings.cutoffDay > 31)) {
    throw new RangeError("Cutoff day must be null or an integer from 1 to 31");
  }
  for (const key of ["primaryCardMemberId", "extraCardMemberId", "invoicePayerMemberId"]) {
    if (![memberAId, memberBId].includes(settings[key])) throw new TypeError("Roles must reference a pair member");
  }
  if (settings.primaryCardMemberId === settings.extraCardMemberId) throw new TypeError("Physical cards must have distinct holders");
  if (typeof settings.enabled !== "boolean" || typeof settings.name !== "string" || !settings.name.trim()) {
    throw new TypeError("Invalid credit card settings");
  }
  return settings;
}

export function summarizeInvoice(invoice, purchases) {
  if (![invoice.id, invoice.accountId, invoice.memberAId, invoice.memberBId].every(value => typeof value === "string" && value.length > 0)
      || invoice.memberAId === invoice.memberBId) {
    throw new TypeError("Invoice identity and two distinct members are required");
  }
  integerCents(invoice.feeCents, "feeCents");
  const feeShares = allocateCents(invoice.feeCents, invoice.feeShareA);
  const seenIds = new Set();
  const summary = {
    purchasesCents: 0,
    feeCents: invoice.feeCents,
    totalCents: invoice.feeCents,
    sharesCents: { ...feeShares },
    byCardCents: {},
    differenceCents: null,
  };
  for (const purchase of purchases) {
    if (purchase.paymentSource !== "creditCard" || purchase.accountId !== invoice.accountId || purchase.invoiceId !== invoice.id) {
      throw new TypeError("Invoice input must contain only purchases belonging to this account and invoice");
    }
    if (!purchase.id || seenIds.has(purchase.id)) throw new TypeError("Purchase IDs must be unique");
    seenIds.add(purchase.id);
    if (![invoice.memberAId, invoice.memberBId].includes(purchase.cardMemberId)) throw new TypeError("Unknown physical card holder");
    if (Number(purchase.excludedAmount || 0) !== 0) throw new TypeError("Invoice purchases require full cost allocation");
    const cents = toCents(purchase.amount);
    const shares = allocateCents(cents, purchaseRatio(purchase));
    summary.purchasesCents = integerCents(summary.purchasesCents + cents);
    summary.sharesCents.a = integerCents(summary.sharesCents.a + shares.a);
    summary.sharesCents.b = integerCents(summary.sharesCents.b + shares.b);
    summary.byCardCents[purchase.cardMemberId] = integerCents((summary.byCardCents[purchase.cardMemberId] || 0) + cents);
  }
  summary.totalCents = integerCents(summary.purchasesCents + invoice.feeCents);
  if (invoice.actualTotalCents != null) {
    summary.differenceCents = integerCents(integerCents(invoice.actualTotalCents) - summary.totalCents);
  }
  return summary;
}

// Preview the proposed debt contribution. Persistence, confirmation and exactly-once
// transfer will be implemented in session 4; this is not a transfer operation.
export function previewInvoiceContribution(invoice, purchases) {
  if (invoice.status !== "reconciled") throw new Error("Invoice must be reconciled");
  if (invoice.transferredAt != null) throw new Error("Invoice was already transferred");
  const summary = summarizeInvoice(invoice, purchases);
  if (summary.differenceCents !== 0) throw new Error("Actual invoice total must match registered costs");
  if (invoice.invoicePayerMemberId === invoice.memberAId) return summary.sharesCents.b;
  if (invoice.invoicePayerMemberId === invoice.memberBId) return -summary.sharesCents.a;
  throw new TypeError("Invoice payer must be a pair member");
}

export function netPairBalanceCents(privateBalance, contributionsCents = []) {
  return contributionsCents.reduce((sum, amount) => integerCents(sum + integerCents(amount)), toCents(privateBalance));
}
