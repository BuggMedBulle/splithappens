import { createCreditCardSettings, makeInvoice, periodForPurchase, invoiceIdForMonth, summarizeInvoice, transitionInvoice } from "./credit-card-model.js";

// All financial mutations read and write the invoice document in the same
// Firestore transaction as the expense. Conflicting writers are retried by Firestore.
export function createCreditStore({ fs, db, bookId, userId, clock = Date.now }) {
  const col = fs.collection(db, "bankbooks", bookId, "entries");
  const bookRef = fs.doc(db, "bankbooks", bookId);
  const ref = id => fs.doc(col, id);
  const read = async (tx, documentRef) => {
    const snap = await tx.get(documentRef);
    return snap.exists() ? { ...snap.data(), id: snap.id } : null;
  };
  const config = book => {
    const profiles = Object.entries(book.members || {});
    const a = profiles.find(([, p]) => p.slot === "A")?.[0];
    const b = profiles.find(([, p]) => p.slot === "B")?.[0];
    if (book.groupType === "group" || book.multiGroup === true || profiles.length !== 2) throw new Error("creditPairOnly");
    return { a, b, settings: createCreditCardSettings(a, b, book.creditCard || {}) };
  };
  async function saveEntry(id, patch, { remove = false, createOnly = false, reason = "", expectedVersion } = {}) {
    return fs.runTransaction(db, async tx => {
      const book = await read(tx, bookRef);
      const old = await read(tx, ref(id));
      if (createOnly && old) return id;
      if (Object.hasOwn(patch, "generatedThrough") && old?.kind !== "recurringTemplate") return null;
      if (old?.kind === "creditInvoice") throw new Error("invoiceProtected");
      if (expectedVersion != null && (old?.financialVersion || 0) !== expectedVersion) throw new Error("staleInvoice");
      const next = remove ? null : { ...old, ...patch, id, updatedBy: userId, financialVersion: (old?.financialVersion || 0) + 1 };
      const financialFields = ["type", "desc", "amount", "icon", "payer", "split", "shareA", "paymentSource", "cardMemberId", "purchaseDate", "manualInvoiceMonth", "excludedAmount", "excludedCostMemberId"];
      const financialChanged = remove || !old || financialFields.some(key => JSON.stringify(old[key] ?? null) !== JSON.stringify(next[key] ?? null));
      if (!financialChanged && next) next.financialVersion = old.financialVersion || 0;
      const hasCard = financialChanged && old?.kind !== "recurringTemplate" && next?.kind !== "recurringTemplate" && (old?.paymentSource === "creditCard" || next?.paymentSource === "creditCard");
      if (next?.recurringId && createOnly) {
        const template = await read(tx, ref(next.recurringId));
        if (!template || template.active === false) return null;
        next.icon = template.icon || next.icon || "🧾";
      }
      const writes = new Map();
      if (hasCard) {
        const { a, b, settings } = config(book);
        if (next?.paymentSource === "creditCard") {
          if (!settings.enabled && old?.paymentSource !== "creditCard") throw new Error("creditDisabled");
          if (next.type !== "expense" || !Number.isFinite(next.amount) || next.amount === 0) throw new Error("invalidAmount");
          const date = next.purchaseDate || new Date(next.ts).toISOString().slice(0, 10);
          const month = next.manualInvoiceMonth || periodForPurchase(date, settings.cutoffDay).month;
          next.accountId = "shared";
          next.invoiceId = invoiceIdForMonth(month);
          next.purchaseDate = date;
          next.manualInvoiceMonth = next.manualInvoiceMonth || null;
        }
        const ids = [...new Set([old?.paymentSource === "creditCard" ? old.invoiceId : null, next?.paymentSource === "creditCard" ? next.invoiceId : null].filter(Boolean))];
        // All reads happen before any transaction write.
        for (const invoiceId of ids) {
          const current = await read(tx, ref(invoiceId));
          const month = invoiceId.replace("credit-invoice-", "");
          const invoice = current || makeInvoice(month, settings, a, b, clock());
          if (Object.keys(invoice.transfers || {}).length && !reason.trim()) throw new Error("correctionReasonRequired");
          if (old?.invoiceId === invoiceId) delete invoice.purchases[id];
          if (next?.invoiceId === invoiceId && next.paymentSource === "creditCard") invoice.purchases[id] = next;
          summarizeInvoice(invoice, Object.values(invoice.purchases));
          invoice.revision += 1;
          invoice.status = invoice.actualTotalCents == null ? "ongoing" : "received";
          invoice.audit[`purchase-${invoice.revision}`] = { at: clock(), by: userId, action: remove ? "removePurchase" : "savePurchase", entryId: id, reason,
            before: old ? Object.fromEntries(financialFields.map(key => [key, old[key] ?? null])) : null,
            after: next ? Object.fromEntries(financialFields.map(key => [key, next[key] ?? null])) : null,
          };
          writes.set(invoiceId, invoice);
        }
      }
      for (const [invoiceId, invoice] of writes) tx.set(ref(invoiceId), invoice);
      if (remove) tx.delete(ref(id));
      else tx.set(ref(id), next);
      return id;
    });
  }
  return {
    saveEntry,
    async ensureInvoice(month) {
      return fs.runTransaction(db, async tx => {
        const book = await read(tx, bookRef);
        const invoiceId = invoiceIdForMonth(month);
        const existing = await read(tx, ref(invoiceId));
        if (existing) return invoiceId;
        const { a, b, settings } = config(book);
        if (!settings.enabled) throw new Error("creditDisabled");
        tx.set(ref(invoiceId), makeInvoice(month, settings, a, b, clock()));
        return invoiceId;
      });
    },
    async invoiceAction(id, action, payload, revision) {
      return fs.runTransaction(db, async tx => {
        const invoice = await read(tx, ref(id));
        if (!invoice || invoice.kind !== "creditInvoice") throw new Error("invoiceMissing");
        const next = transitionInvoice(invoice, action, payload, revision, userId, clock());
        tx.set(ref(id), next);
      });
    },
    async saveSettings(settings) {
      return fs.runTransaction(db, async tx => {
        const book = await read(tx, bookRef);
        const { a, b } = config(book);
        const validated = createCreditCardSettings(a, b, settings);
        if (validated.enabled && validated.cutoffDay == null) throw new Error("configureCutoff");
        tx.update(bookRef, { creditCard: validated });
      });
    },
  };
}
