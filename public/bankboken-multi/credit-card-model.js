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
  if (settings.firstPeriodMonth) periodForMonth(settings.firstPeriodMonth, settings.cutoffDay);
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
    const cents = toCents(purchase.amount);
    const shares = invoiceCostShares(purchase, invoice);
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

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("invalidDate");
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("invalidDate");
  return date;
}

export function periodForMonth(month, cutoffDay) {
  if (!/^\d{4}-\d{2}$/.test(month) || !Number.isInteger(cutoffDay) || cutoffDay < 1 || cutoffDay > 31) throw new Error("configureCutoff");
  const [year, m] = month.split("-").map(Number);
  if (m < 1 || m > 12 || year < 1900 || year > 9998) throw new Error("invalidDate");
  const cutoff = offset => {
    const last = new Date(Date.UTC(year, m - 1 + offset + 1, 0, 12));
    return new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), Math.min(cutoffDay, last.getUTCDate()), 12));
  };
  const previous = cutoff(-1);
  previous.setUTCDate(previous.getUTCDate() + 1);
  return { month, start: previous.toISOString().slice(0, 10), end: cutoff(0).toISOString().slice(0, 10) };
}

export function periodForPurchase(dateValue, cutoffDay) {
  const date = validDate(dateValue);
  let month = dateValue.slice(0, 7);
  const period = periodForMonth(month, cutoffDay);
  if (dateValue > period.end) {
    date.setUTCMonth(date.getUTCMonth() + 1, 1);
    month = date.toISOString().slice(0, 7);
  }
  return periodForMonth(month, cutoffDay);
}

export const invoiceIdForMonth = month => `credit-invoice-${month}`;

export function makeInvoice(month, settings, memberAId, memberBId, now) {
  const period = periodForMonth(month, settings.cutoffDay);
  return {
    id: invoiceIdForMonth(month), kind: "creditInvoice", type: "creditInvoice", accountId: "shared",
    memberAId, memberBId, primaryCardMemberId: settings.primaryCardMemberId, extraCardMemberId: settings.extraCardMemberId, month, periodStart: period.start, periodEnd: period.end,
    ts: Date.parse(`${period.end}T12:00:00Z`), status: "ongoing", revision: 0,
    feeCents: settings.feeCents, feeShareA: settings.feeShareA,
    invoicePayerMemberId: settings.invoicePayerMemberId, actualTotalCents: null, dueDate: "",
    purchases: {}, transfers: {}, audit: {}, bankPaidAt: null, transferredAt: null, createdAt: now,
  };
}

export function postedInvoiceCents(invoice) {
  return Object.values(invoice.transfers || {}).reduce((sum, transfer) => integerCents(sum + integerCents(transfer.cents)), 0);
}

export function invoiceCostShares(purchase, invoice) {
  const amountCents = toCents(purchase.amount);
  const excluded = toCents(Number(purchase.excludedAmount || 0));
  if (excluded < 0 || excluded > Math.abs(amountCents)) throw new Error("invalidAllocation");
  const signedExcluded = Math.sign(amountCents) * excluded;
  const shares = allocateCents(amountCents - signedExcluded, purchaseRatio(purchase));
  if (excluded) {
    if (purchase.excludedCostMemberId === invoice.memberAId) shares.a += signedExcluded;
    else if (purchase.excludedCostMemberId === invoice.memberBId) shares.b += signedExcluded;
    else throw new Error("assignExcludedCosts");
  }
  return shares;
}

// Only the unposted difference is upcoming; posted amounts already belong to Swish.
export function pendingCreditBalance(invoices) {
  return invoices.reduce((sum, invoice) => {
    const shares = summarizeInvoice(invoice, Object.values(invoice.purchases || {})).sharesCents;
    let target;
    if (invoice.invoicePayerMemberId === invoice.memberAId) target = shares.b;
    else if (invoice.invoicePayerMemberId === invoice.memberBId) target = -shares.a;
    else throw new TypeError("Invoice payer must be a pair member");
    return integerCents(sum + target - postedInvoiceCents(invoice));
  }, 0) / 100;
}

export function pairCreditBalance(entries, invoices, privateBalanceOf) {
  return netPairBalanceCents(privateBalanceOf(entries.filter(e => e.paymentSource !== "creditCard")), invoices.map(postedInvoiceCents)) / 100;
}

export function invoiceFeeEntries(invoices) {
  return invoices.map(invoice => ({
    id: `fee-${invoice.id}`, type: "expense", desc: "creditFee", icon: "💳", ts: invoice.ts,
    amount: invoice.feeCents / 100, split: "custom", shareA: invoice.feeShareA,
    paymentSource: "creditFee", invoiceId: invoice.id, memberAId: invoice.memberAId, memberBId: invoice.memberBId,
  }));
}

// Immutable ledger entries keep already-paid debt unchanged when an invoice is edited.
export function transitionInvoice(invoice, action, payload, expectedRevision, userId, now) {
  if (invoice.revision !== expectedRevision) throw new Error("staleInvoice");
  const next = structuredClone(invoice);
  const posted = Object.keys(next.transfers || {}).length > 0;
  if (action === "bankPaid") {
    if (next.bankPaidAt != null) return next;
    next.bankPaidAt = now;
    next.bankPaidBy = userId;
    next.audit[`bank-${now}`] = { at: now, by: userId, action };
    return next;
  }
  if (action === "transfer" && next.transfers?.[`r${next.revision}`]) return next;
  if (action === "edit") {
    if (posted && !payload.reason?.trim()) throw new Error("correctionReasonRequired");
    for (const key of ["feeCents", "feeShareA", "actualTotalCents", "dueDate", "periodStart", "periodEnd", "invoicePayerMemberId"]) {
      if (Object.hasOwn(payload, key)) next[key] = payload[key];
    }
    validDate(next.periodStart); validDate(next.periodEnd);
    if (next.periodStart > next.periodEnd) throw new Error("invalidDate");
    if (next.dueDate) validDate(next.dueDate);
    if (![next.memberAId, next.memberBId].includes(next.invoicePayerMemberId)) throw new Error("invalidPayer");
    summarizeInvoice(next, Object.values(next.purchases));
    next.ts = Date.parse(`${next.periodEnd}T12:00:00Z`);
    next.revision += 1;
    next.status = next.actualTotalCents == null ? "ongoing" : "received";
  } else if (action === "reconcile") {
    if (next.status === "transferred") return next;
    if (summarizeInvoice(next, Object.values(next.purchases)).differenceCents !== 0) throw new Error("invoiceMismatch");
    next.status = "reconciled";
  } else if (action === "transfer") {
    if (next.status !== "reconciled") throw new Error("reconcileFirst");
    const desired = previewInvoiceContribution({ ...next, transferredAt: null }, Object.values(next.purchases));
    const cents = desired - postedInvoiceCents(next);
    if (posted && !payload.reason?.trim()) throw new Error("correctionReasonRequired");
    next.transfers[`r${next.revision}`] = { cents, targetCents: desired, totalCents: summarizeInvoice(next, Object.values(next.purchases)).totalCents, sharesCents: summarizeInvoice(next, Object.values(next.purchases)).sharesCents, at: now, by: userId, reason: payload.reason || "", payerMemberId: next.invoicePayerMemberId };
    next.transferredAt = now;
    next.status = "transferred";
  } else throw new Error("invalidAction");
  next.audit[`${action}-${next.revision}-${now}`] = {
    at: now, by: userId, action, reason: payload.reason || "",
    ...(action === "edit" ? {
      before: Object.fromEntries(["feeCents", "feeShareA", "actualTotalCents", "invoicePayerMemberId", "periodStart", "periodEnd", "dueDate"].map(key => [key, invoice[key] ?? null])),
      after: Object.fromEntries(["feeCents", "feeShareA", "actualTotalCents", "invoicePayerMemberId", "periodStart", "periodEnd", "dueDate"].map(key => [key, next[key] ?? null])),
    } : {}),
  };
  return next;
}

// Stable display name: count calendar days, not purchases that may be added later.
// In a tie the closing month wins. Stored IDs and period boundaries stay unchanged.
export function invoiceDisplayMonth(invoice) {
  const start = Date.parse(`${invoice.periodStart}T00:00:00Z`);
  const end = Date.parse(`${invoice.periodEnd}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 366 * 86400000) throw new Error("invalidDate");
  const counts = new Map();
  for (let day = start; day <= end; day += 86400000) {
    const month = new Date(day).toISOString().slice(0, 7);
    counts.set(month, (counts.get(month) || 0) + 1);
  }
  return [...counts].reduce((best, item) => item[1] >= best[1] ? item : best)[0];
}

export function formatInvoiceMonth(month, language = "sv") {
  const label = new Date(`${month}-01T12:00:00`).toLocaleDateString(language === "en" ? "en-GB" : "sv-SE", { month: "short", year: "numeric" }).replace(/\./g, "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Empty setup invoices before the account's chosen start are kept for recovery,
// but excluded from both displayed invoices and financial calculations.
export function visibleCreditInvoices(invoices, settings) {
  return invoices.filter(i => !settings?.firstPeriodMonth || i.month >= settings.firstPeriodMonth
    || Object.keys(i.purchases || {}).length || Object.keys(i.transfers || {}).length
    || i.bankPaidAt != null || (i.actualTotalCents != null && i.actualTotalCents !== 0));
}
