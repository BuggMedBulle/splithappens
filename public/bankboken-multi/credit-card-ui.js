import { createCreditCardSettings, periodForPurchase, periodForMonth, invoiceDisplayMonth, invoiceIdForMonth, summarizeInvoice, postedInvoiceCents, invoiceCostShares, toCents } from "./credit-card-model.js?v=invoice-name-20261014";

export function createCreditUI(ctx) {
  const $ = id => document.getElementById(id);
  let selectedId = "";
  let dirtyInvoice = false;
  let creatingKey = "";
  let editingCredit = false;
  const profiles = () => ctx.profiles();
  const name = id => profiles().find(([uid, profile]) => uid === id || profile.claimedBy === id)?.[1]?.name || "?";
  const pairIds = () => ({ a: profiles().find(([, p]) => p.slot === "A")?.[0], b: profiles().find(([, p]) => p.slot === "B")?.[0] });
  const settings = () => {
    const { a, b } = pairIds();
    return createCreditCardSettings(a, b, ctx.book()?.creditCard || {});
  };
  const eligible = () => ctx.isPair() && profiles().length === 2;
  const active = () => eligible() && ctx.book()?.creditCard?.enabled;
  const invoice = () => ctx.invoices().find(i => i.id === selectedId);
  const option = (value, label) => `<option value="${ctx.escape(value)}">${ctx.escape(label)}</option>`;
  function membersSelect(element, suffixes = false) {
    const previous = element.value;
    const config = eligible() ? settings() : {};
    element.innerHTML = profiles().map(([id]) => option(id, `${name(id)}${suffixes ? ` · ${ctx.t(id === config.primaryCardMemberId ? "creditPrimary" : "creditExtra")}` : ""}`)).join("");
    if (profiles().some(([id]) => id === previous)) element.value = previous;
  }
  function error(err) {
    const key = err?.message || "creditError";
    const known = ctx.t(key);
    return known === key ? ctx.t("creditError") : known;
  }
  async function run(button, action) {
    if (button.disabled) return;
    button.disabled = true;
    $("credit-error").hidden = true;
    try { await action(); }
    catch (err) { $("credit-error").textContent = error(err); $("credit-error").hidden = false; }
    finally { button.disabled = false; render(); }
  }
  function settingsOpen() {
    $("credit-settings").hidden = !eligible();
    if (!eligible()) return;
    const config = settings();
    $("credit-enable").checked = config.enabled;
    $("credit-name").value = config.name;
    for (const [id, key] of [["credit-primary", "primaryCardMemberId"], ["credit-extra", "extraCardMemberId"], ["credit-payer", "invoicePayerMemberId"]]) {
      membersSelect($(id)); $(id).value = config[key];
    }
    $("credit-fee").value = config.feeCents / 100;
    $("credit-fee-share").value = config.feeShareA * 100;
    $("credit-cutoff").value = config.cutoffDay || "";
    $("credit-settings-fields").hidden = !config.enabled;
  }
  async function saveSettings() {
    if (!eligible()) return;
    const { a, b } = pairIds();
    const enabled = $("credit-enable").checked;
    const config = createCreditCardSettings(a, b, {
      enabled, name: $("credit-name").value.trim() || settings().name,
      primaryCardMemberId: $("credit-primary").value, extraCardMemberId: $("credit-extra").value,
      invoicePayerMemberId: $("credit-payer").value,
      feeCents: toCents(Number($("credit-fee").value)), feeShareA: Number($("credit-fee-share").value) / 100,
      cutoffDay: $("credit-cutoff").value ? Number($("credit-cutoff").value) : null,
    });
    await ctx.store().credit.saveSettings(config);
    ctx.book().creditCard = config;
  }
  function cardSelected() { return eligible() && ctx.payer() === "creditCard" && ctx.entryType() === "expense"; }
  function controls(entry) {
    if (entry !== undefined) {
      editingCredit = entry?.paymentSource === "creditCard";
      membersSelect($("credit-card-used"), true);
      membersSelect($("credit-excluded-owner"));
      $("credit-card-used").value = entry?.cardMemberId || pairIds()[ctx.slot() === "A" ? "a" : "b"] || "";
      $("credit-excluded-owner").value = entry?.excludedCostMemberId || pairIds()[ctx.slot() === "A" ? "a" : "b"] || "";
      $("credit-manual").checked = Boolean(entry?.manualInvoiceMonth);
      $("credit-purchase-month").value = entry?.manualInvoiceMonth || "";
    }
    $("credit-source-button").hidden = !eligible() || (!active() && !editingCredit) || ctx.entryType() !== "expense";
    const card = cardSelected();
    $("credit-purchase-fields").hidden = !card;
    $("e-amount").min = card ? "" : "0.01";
    if (card) {
      if (!$("credit-card-used").options.length) membersSelect($("credit-card-used"), true);
      if (!$("credit-excluded-owner").options.length) membersSelect($("credit-excluded-owner"));
      $("credit-purchase-month").disabled = !$("credit-manual").checked;
      try {
        if (!$("credit-manual").checked) $("credit-purchase-month").value = periodForPurchase($("e-date").value || ctx.today(), settings().cutoffDay).month;
        const month = $("credit-purchase-month").value;
        const existing = ctx.invoices().find(i => i.id === invoiceIdForMonth(month));
        const period = periodForMonth(month, settings().cutoffDay);
        $("credit-purchase-period").textContent = periodLabel(existing || { periodStart: period.start, periodEnd: period.end });
      } catch { $("credit-purchase-month").value = ""; $("credit-purchase-period").textContent = ""; }
      $("credit-purchase-month").closest("label").hidden = !$("credit-manual").checked;
      $("credit-excluded-fields").hidden = !(ctx.excludedAmount() > 0 || ctx.editingEntry()?.excludedAmount > 0);
    }
  }
  function purchaseFields(amount) {
    if (!cardSelected()) return { paymentSource: "private", cardMemberId: null, invoiceId: null, manualInvoiceMonth: null, excludedCostMemberId: null };
    const config = settings();
    const excluded = ctx.excludedAmount() || (ctx.editingEntry()?.excludedAmount || 0);
    const purchaseDate = $("e-date").value;
    const month = $("credit-manual").checked ? $("credit-purchase-month").value : periodForPurchase(purchaseDate, config.cutoffDay).month;
    return {
      paymentSource: "creditCard", accountId: "shared", cardMemberId: $("credit-card-used").value,
      invoiceId: invoiceIdForMonth(month), manualInvoiceMonth: $("credit-manual").checked ? month : null,
      purchaseDate, amount: amount + (ctx.excludedAmount() || 0), excludedAmount: excluded,
      excludedCostMemberId: excluded ? $("credit-excluded-owner").value : null,
    };
  }
  function correctionReason(entry, targetInvoiceId) {
    const ids = [entry?.invoiceId, targetInvoiceId].filter(Boolean);
    const posted = ctx.invoices().some(i => ids.includes(i.id) && Object.keys(i.transfers || {}).length);
    if (!posted) return "";
    const reason = window.prompt(ctx.t("creditReasonPrompt"));
    if (!reason?.trim()) throw new Error("correctionReasonRequired");
    return reason.trim();
  }
  function reset() { selectedId = ""; dirtyInvoice = false; creatingKey = ""; editingCredit = false; $("credit-modal").hidden = true; $("credit-summary").hidden = true; $("credit-trigger").hidden = true; }
  async function ensureCurrent() {
    if (!active()) return;
    let month;
    try { month = periodForPurchase(ctx.today(), settings().cutoffDay).month; } catch { return; }
    const key = `${ctx.book().id}-${month}`;
    if (creatingKey === key || ctx.invoices().some(i => i.id === invoiceIdForMonth(month))) return;
    creatingKey = key;
    try { await ctx.store().credit.ensureInvoice(month); }
    catch (err) { creatingKey = ""; ctx.syncError(err); }
  }
  function fillInvoice(i) {
    $("credit-invoice-form").dataset.revision = String(i.revision);
    $("credit-actual").value = i.actualTotalCents == null ? "" : i.actualTotalCents / 100;
    $("credit-invoice-fee").value = i.feeCents / 100;
    $("credit-invoice-share").value = i.feeShareA * 100;
    membersSelect($("credit-invoice-payer")); $("credit-invoice-payer").value = i.invoicePayerMemberId;
    $("credit-due").value = i.dueDate || "";
    $("credit-period-start").value = i.periodStart;
    $("credit-period-end").value = i.periodEnd;
  }
  function periodLabel(i) {
    const format = value => new Date(`${value}T12:00:00`).toLocaleDateString(ctx.language() === "en" ? "en-GB" : "sv-SE", { day: "numeric", month: "short" });
    return `${invoiceDisplayMonth(i)} (${format(i.periodStart)}–${format(i.periodEnd)})`;
  }
  function render() {
    $("credit-summary").hidden = !eligible() || (!active() && !ctx.invoices().length);
    $("credit-trigger").hidden = $("credit-summary").hidden;
    if ($( "credit-summary").hidden) return;
    const all = [...ctx.invoices()].sort((a, b) => b.month.localeCompare(a.month));
    const upcoming = all.find(i => i.status !== "transferred") || all[0];
    if (upcoming) {
      const total = summarizeInvoice(upcoming, Object.values(upcoming.purchases));
      const ownShare = ctx.slot() === "A" ? total.sharesCents.a : total.sharesCents.b;
      $("credit-summary-copy").textContent = `${ctx.book().creditCard?.name || ctx.t("creditTitle")} · ${periodLabel(upcoming)} · ${ctx.kr(total.totalCents / 100)} · ${ctx.t("creditYourShare")}: ${ctx.kr(ownShare / 100)}`;
      $("credit-summary-note").textContent = ctx.t(upcoming.status === "transferred" ? "creditTransferred" : Object.keys(upcoming.transfers || {}).length ? "creditPendingCorrection" : "creditPreliminary");
    } else $("credit-summary-copy").textContent = ctx.t("creditNoInvoices");
    if ($("credit-modal").hidden) return;
    if (!all.some(i => i.id === selectedId)) { selectedId = all[0]?.id || ""; dirtyInvoice = false; }
    $("credit-invoice-select").innerHTML = all.map(i => option(i.id, periodLabel(i))).join("");
    $("credit-invoice-select").value = selectedId;
    $("credit-new-period").hidden = !active();
    const i = invoice();
    $("credit-invoice-content").hidden = !i;
    if (!i) return;
    const summary = summarizeInvoice(i, Object.values(i.purchases));
    const status = { ongoing: "creditOngoing", received: "creditReceived", reconciled: "creditReconciled", transferred: "creditSettled" };
    $("credit-invoice-status").textContent = `${ctx.t("creditStatus")}: ${ctx.t(status[i.status])}`;
    $("credit-invoice-totals").innerHTML = [
      [ctx.t("creditPurchases"), summary.purchasesCents], [ctx.t("creditFee"), summary.feeCents],
      [ctx.t("creditExpected"), summary.totalCents], [ctx.t("creditDifference"), summary.differenceCents],
      [name(i.memberAId), summary.sharesCents.a], [name(i.memberBId), summary.sharesCents.b],
      [ctx.t("creditPrimary") + " · " + name((i.primaryCardMemberId || settings().primaryCardMemberId)), summary.byCardCents[(i.primaryCardMemberId || settings().primaryCardMemberId)] || 0],
      [ctx.t("creditExtra") + " · " + name((i.extraCardMemberId || settings().extraCardMemberId)), summary.byCardCents[(i.extraCardMemberId || settings().extraCardMemberId)] || 0],
    ].map(([label, cents]) => `<div class="credit-total"><span>${ctx.escape(label)}</span><strong>${cents == null ? "—" : ctx.kr(cents / 100)}</strong></div>`).join("");
    if (!dirtyInvoice) fillInvoice(i);
    const stale = Number($("credit-invoice-form").dataset.revision) !== i.revision;
    $("credit-reconcile").disabled = dirtyInvoice || stale || summary.differenceCents !== 0 || i.status === "transferred";
    $("credit-transfer").disabled = dirtyInvoice || stale || i.status !== "reconciled";
    $("credit-bank-paid").textContent = ctx.t(i.bankPaidAt == null ? "creditBankNotPaid" : "creditBankPaid");
    $("credit-mark-bank").disabled = i.bankPaidAt != null;
    const filter = $("credit-card-filter").value;
    $("credit-card-filter").innerHTML = option("", ctx.t("creditAllCards")) + profiles().map(([id]) => option(id, name(id))).join("");
    $("credit-card-filter").value = filter;
    const lines = Object.values(i.purchases).filter(p => !filter || p.cardMemberId === filter).sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
    $("credit-transactions").innerHTML = lines.map(p => {
      const shares = invoiceCostShares(p, i);
      return `<button type="button" class="credit-transaction" data-credit-edit="${ctx.escape(p.id)}"><span>${ctx.escape(p.icon || "🧾")} ${ctx.escape(p.desc)}<small>${ctx.escape(p.purchaseDate)} · ${ctx.escape(name(p.cardMemberId))}<br>${ctx.escape(name(i.memberAId))}: ${ctx.kr(shares.a / 100)} · ${ctx.escape(name(i.memberBId))}: ${ctx.kr(shares.b / 100)}</small></span><strong>${ctx.kr(p.amount)}</strong></button>`;
    }).join("");
    const events = [
      ...Object.values(i.transfers || {}).map(e => ({ ...e, label: `${ctx.t("creditTransferEvent")}: ${ctx.kr(e.cents / 100)}` })),
      ...Object.values(i.audit || {}).map(e => ({ ...e, label: ctx.t(e.action === "bankPaid" ? "creditBankEvent" : "creditChangeEvent") })),
    ].sort((a, b) => b.at - a.at);
    $("credit-audit").innerHTML = events.map(e => `<li>${ctx.escape(e.label)}<small>${ctx.escape(new Date(e.at).toLocaleString(ctx.language() === "en" ? "en-SE" : "sv-SE"))} · ${ctx.escape(name(e.by))}${e.reason ? ` · ${ctx.escape(e.reason)}` : ""}${e.before?.amount != null || e.after?.amount != null ? ` · ${ctx.kr(e.before?.amount || 0)} → ${ctx.kr(e.after?.amount || 0)}` : ""}</small></li>`).join("");
    $("credit-transfer-explanation").textContent = ctx.t(i.status === "transferred" ? "creditTransferred" : "creditPreliminary");
    $("credit-reason").closest("label").hidden = !Object.keys(i.transfers || {}).length;
    $("credit-posted").textContent = `${ctx.t("creditTransferEvent")}: ${ctx.kr(postedInvoiceCents(i) / 100)}`;
  }
  function open() {
    $("credit-modal").hidden = false;
    $("credit-error").hidden = true;
    dirtyInvoice = false;
    $("credit-reason").value = "";
    $("credit-new-month").value = ctx.today().slice(0, 7);
    render();
    ensureCurrent();
    $("credit-close").focus();
  }
  $("credit-enable").addEventListener("change", () => { $("credit-settings-fields").hidden = !$("credit-enable").checked; });
  for (const id of ["credit-trigger", "credit-open"]) $(id).addEventListener("click", open);
  $("credit-close").addEventListener("click", () => { $("credit-modal").hidden = true; $("credit-trigger").focus(); });
  $("credit-modal").addEventListener("click", event => { if (event.target === event.currentTarget) $("credit-modal").hidden = true; });
  document.addEventListener("keydown", e => {
    if ($("credit-modal").hidden) return;
    if (e.key === "Escape") { $("credit-modal").hidden = true; $("credit-trigger").focus(); }
    if (e.key === "Tab") {
      const items = [...$("credit-modal").querySelectorAll("button, input, select, summary, [tabindex='0']")].filter(el => !el.disabled && el.getClientRects().length);
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items.at(-1)?.focus(); }
      else if (!e.shiftKey && document.activeElement === items.at(-1)) { e.preventDefault(); items[0]?.focus(); }
    }
  });
  $("credit-invoice-select").addEventListener("change", e => { selectedId = e.target.value; dirtyInvoice = false; $("credit-reason").value = ""; render(); });
  $("credit-card-filter").addEventListener("change", render);
  $("credit-create-period").addEventListener("click", e => run(e.currentTarget, async () => {
    selectedId = await ctx.store().credit.ensureInvoice($("credit-new-month").value); dirtyInvoice = false; render();
  }));
  $("credit-invoice-form").addEventListener("input", e => { if (e.target.id === "credit-reason") return; dirtyInvoice = true; $("credit-reconcile").disabled = true; $("credit-transfer").disabled = true; });
  $("credit-invoice-form").addEventListener("submit", e => {
    e.preventDefault();
    run(e.submitter, async () => {
      await ctx.store().credit.invoiceAction(selectedId, "edit", {
        actualTotalCents: $("credit-actual").value === "" ? null : toCents(Number($("credit-actual").value)),
        feeCents: toCents(Number($("credit-invoice-fee").value)), feeShareA: Number($("credit-invoice-share").value) / 100,
        invoicePayerMemberId: $("credit-invoice-payer").value, dueDate: $("credit-due").value,
        periodStart: $("credit-period-start").value, periodEnd: $("credit-period-end").value, reason: $("credit-reason").value,
      }, Number($("credit-invoice-form").dataset.revision));
      dirtyInvoice = false; render();
    });
  });
  for (const [id, action] of [["credit-reconcile", "reconcile"], ["credit-transfer", "transfer"], ["credit-mark-bank", "bankPaid"]]) {
    $(id).addEventListener("click", e => {
      if (action === "transfer" && !window.confirm(ctx.t("creditTransferConfirm"))) return;
      run(e.currentTarget, async () => { await ctx.store().credit.invoiceAction(selectedId, action, { reason: $("credit-reason").value }, Number($("credit-invoice-form").dataset.revision)); render(); });
    });
  }
  $("credit-transactions").addEventListener("click", e => {
    const id = e.target.closest("[data-credit-edit]")?.dataset.creditEdit;
    const entry = ctx.entries().find(p => p.id === id);
    if (entry) { $("credit-modal").hidden = true; ctx.edit(entry); }
  });
  for (const id of ["credit-manual", "credit-purchase-month", "credit-card-used", "credit-excluded-owner"]) $(id).addEventListener("change", () => { controls(); ctx.preview(); ctx.dirty(); });
  return { settingsOpen, saveSettings, controls, purchaseFields, cardSelected, correctionReason, reset, render, ensureCurrent, error };
}
