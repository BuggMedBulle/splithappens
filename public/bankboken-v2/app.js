import { FIREBASE_CONFIG } from "./config.js";

let PEOPLE = {
  A: { name: "Person 1", swish: "" },
  B: { name: "Person 2", swish: "" },
};
let firebaseApp;
let db;
let fs;
let auth;
let authApi;
let signedInUser;
let activeBankbook;
let unsubscribeEntries;
let unsubscribeWaitingRoom;
let unsubscribeActiveBankbook;
let openingBankbook = false;

const TRANSLATIONS = {
  sv: {
    authIntro: "Logga in för att komma åt er delning.", authRegisterIntro: "Skapa ett konto för att komma igång.", yourName: "Ditt namn", swishNumber: "Swishnummer",
    email: "E-post", password: "Lösenord, minst 6 tecken", login: "Logga in", createAccount: "Skapa ett konto",
    forgotPassword: "Glömt lösenord?", inviteOther: "Bjud in den andra personen",
    inviteHelp: "Skicka länken. Den här sidan öppnar appen automatiskt så fort personen har anslutit.",
    copyLink: "Kopiera länk", copied: "Kopierad!", share: "Dela", gotInvite: "Har du fått en inbjudan?",
    pasteInvite: "Klistra in länk eller kod", join: "Anslut", logout: "Logga ut", settings: "Inställningar",
    closeSettings: "Stäng inställningar", balance: "Saldo", markPaid: "Markera som swishat", add: "Lägg till",
    expense: "Utgift", income: "Inkomst", description: "Beskrivning", descriptionExample: "t.ex. Matvaror ICA",
    amount: "Belopp", date: "Datum", split: "Delning", custom: "Anpassad", history: "Historik",
    language: "Språk", theme: "Tema", profileColor: "Avatarfärg", avatar: "Avatar", customizeAvatar: "Anpassa avatar", chooseAvatar: "Välj en avatar", choose: "Välj", cancel: "Avbryt", initial: "Initial", emoji: "Emoji", optionalEmoji: "Valfri emoji", chooseEmoji: "Välj emoji", customEmoji: "Annan emoji…", systemTheme: "Auto", lightTheme: "Ljust", darkTheme: "Mörkt", saveChanges: "Spara ändringar", you: "Du", youObject: "dig", payerYou: "Dig", receivedBy: "Mottaget av",
    paidBy: "Betalat av", addIncome: "Lägg till inkomst", addExpense: "Lägg till utgift",
    editIncome: "Redigera inkomst", editExpense: "Redigera utgift", save: "Spara ändringar",
    allEven: "Allt är jämnt. Ingen är skyldig något.", oweSelf: "är skyldig", owesOther: "är skyldig", total: "Totalt",
    noEntries: "Inga utgifter än. Lägg till er första ovan.", noEntriesFor: "Inga utgifter för {name}.",
    page: "Sida {page} av {count}", settlement: "Betalning", paid: "betalade", received: "tog emot",
    treated: "bjöd 💕", delete: "Ta bort", deleteEntry: "Ta bort denna post?",
    entitledAll: "{name} har rätt till hela inkomsten.", entitled: "{name} har rätt till {amount}.",
    noDebtFull: "Ingen skuld – {name} står för hela beloppet.", becomesOwed: "{name} blir skyldig {recipient} {amount}.",
    welcomeWaiting: "Hej {name}! Väntar på den andra personen…", createAccountShort: "Skapa konto",
    alreadyAccount: "Jag har redan ett konto", sending: "Skickar…",
    resetSent: "Ett återställningsmail har skickats. Kontrollera även skräpposten.",
    enterEmail: "Fyll i din e-postadress först.", shareInvite: "Anslut till vår delning",
    completeAccount: "Slutför konto", switchAccount: "Logga ut och byt konto", synced: "Synkad (Firebase)",
    syncFailed: "Synkningen misslyckades", syncing: "Ansluter…", incomeIcon: "Inkomst", otherIcon: "Övrigt",
    inviteLink: "Inbjudningslänk", settleSwish: "Reglera med Swish", payWith: "Betala med", chooseCategory: "Välj kategori",
    currencySuffix: "kr", cancelEditing: "Avbryt redigering", deleteExpense: "Ta bort utlägg",
    historyPages: "Historiksidor", previousPage: "Föregående sida", nextPage: "Nästa sida",
    groceries: "Mat", meal: "Lunch eller middag", cinema: "Bio", snacks: "Snacks eller godis",
    alcohol: "Alkohol", travel: "Resa", taxi: "Taxi", liveSport: "Live-sport", fuel: "Bensin",
    shopping: "Shopping", experiences: "Upplevelser eller utflykter",
    receipt: "Kvitto", addReceipt: "Lägg till bild", changeReceipt: "Byt bild", removeReceipt: "Ta bort",
    receiptPreview: "Förhandsvisning av kvitto", receiptTooLarge: "Bilden är för stor. Välj en bild under 15 MB.",
    receiptInvalid: "Bilden kunde inte läsas. Prova en annan bild.", receiptUploadFailed: "Kvittot kunde inte laddas upp. Försök igen.",
    openReceipt: "Öppna kvittot i full storlek", closeReceipt: "Stäng kvitto", receiptFullSize: "Kvitto i full storlek", receiptZoomHint: "Nyp för att zooma · dra för att flytta",
  },
  en: {
    authIntro: "Log in to access your shared expenses.", authRegisterIntro: "Create an account to get started.", yourName: "Your name", swishNumber: "Swish number",
    email: "Email", password: "Password, at least 6 characters", login: "Log in", createAccount: "Create an account",
    forgotPassword: "Forgot password?", inviteOther: "Invite the other person",
    inviteHelp: "Send the link. This page opens the app automatically as soon as the other person joins.",
    copyLink: "Copy link", copied: "Copied!", share: "Share", gotInvite: "Have you received an invitation?",
    pasteInvite: "Paste link or code", join: "Join", logout: "Log out", settings: "Settings",
    closeSettings: "Close settings", balance: "Balance", markPaid: "Mark as paid", add: "Add",
    expense: "Expense", income: "Income", description: "Description", descriptionExample: "e.g. Groceries",
    amount: "Amount", date: "Date", split: "Split", custom: "Custom", history: "History",
    language: "Language", theme: "Theme", profileColor: "Avatar color", avatar: "Avatar", customizeAvatar: "Customize avatar", chooseAvatar: "Choose an avatar", choose: "Choose", cancel: "Cancel", initial: "Initial", emoji: "Emoji", optionalEmoji: "Optional emoji", chooseEmoji: "Choose emoji", customEmoji: "Other emoji…", systemTheme: "Auto", lightTheme: "Light", darkTheme: "Dark", saveChanges: "Save changes", you: "You", youObject: "you", payerYou: "You", receivedBy: "Received by",
    paidBy: "Paid by", addIncome: "Add income", addExpense: "Add expense",
    editIncome: "Edit income", editExpense: "Edit expense", save: "Save changes",
    allEven: "Everything is settled. No one owes anything.", oweSelf: "owe", owesOther: "owes", total: "Total",
    noEntries: "No expenses yet. Add your first one above.", noEntriesFor: "No expenses for {name}.",
    page: "Page {page} of {count}", settlement: "Settlement", paid: "paid", received: "received",
    treated: "treated {recipient} 💕", delete: "Delete", deleteEntry: "Delete this entry?",
    entitledAll: "{name} is entitled to all of the income.", entitled: "{name} is entitled to {amount}.",
    noDebtFull: "No debt – {name} covers the full amount.", becomesOwed: "{name} owes {recipient} {amount}.",
    welcomeWaiting: "Hi {name}! Waiting for the other person…", createAccountShort: "Create account",
    alreadyAccount: "I already have an account", sending: "Sending…",
    resetSent: "A password reset email has been sent. Please also check your spam folder.",
    enterEmail: "Enter your email address first.", shareInvite: "Join our shared expenses",
    completeAccount: "Complete account", switchAccount: "Log out and switch account", synced: "Synced (Firebase)",
    syncFailed: "Sync failed", syncing: "Connecting…", incomeIcon: "Income", otherIcon: "Other",
    inviteLink: "Invitation link", settleSwish: "Settle with Swish", payWith: "Settle with", chooseCategory: "Choose category",
    currencySuffix: "SEK", cancelEditing: "Cancel editing", deleteExpense: "Delete expense",
    historyPages: "History pages", previousPage: "Previous page", nextPage: "Next page",
    groceries: "Groceries", meal: "Lunch or dinner", cinema: "Cinema", snacks: "Snacks or candy",
    alcohol: "Alcohol", travel: "Travel", taxi: "Taxi", liveSport: "Live sports", fuel: "Fuel",
    shopping: "Shopping", experiences: "Experiences or excursions",
    receipt: "Receipt", addReceipt: "Add image", changeReceipt: "Change image", removeReceipt: "Remove",
    receiptPreview: "Receipt preview", receiptTooLarge: "The image is too large. Choose an image under 15 MB.",
    receiptInvalid: "The image could not be read. Try another image.", receiptUploadFailed: "The receipt could not be uploaded. Please try again.",
    openReceipt: "Open receipt full size", closeReceipt: "Close receipt", receiptFullSize: "Receipt in full size", receiptZoomHint: "Pinch to zoom · drag to move",
  },
};
const requestedLanguage = new URL(window.location.href).searchParams.get("lang");
let LANGUAGE = requestedLanguage === "en" || requestedLanguage === "sv"
  ? requestedLanguage
  : (localStorage.getItem("split-happens-language") === "en" ? "en" : "sv");
if (requestedLanguage === "en" || requestedLanguage === "sv") {
  localStorage.setItem("split-happens-language", LANGUAGE);
}
const savedTheme = localStorage.getItem("split-happens-theme");
let THEME = ["system", "light", "dark"].includes(savedTheme) ? savedTheme : "system";
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const PROFILE_COLORS = ["#ef5b5b", "#f28c45", "#e6c84f", "#62b86b", "#5c8de8", "#9a6dd7"];
let SETTINGS_COLOR = PROFILE_COLORS[0];
let SETTINGS_AVATAR_MODE = "letter";
let SETTINGS_AVATAR_EMOJI = "";
let AVATAR_MODAL_ORIGINAL = null;

function validProfileColor(color) {
  return PROFILE_COLORS.includes(String(color || "").toLowerCase());
}

function defaultProfileColor(seed = "") {
  const total = [...seed].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return PROFILE_COLORS[total % PROFILE_COLORS.length];
}

function personColor(personKey) {
  const color = PEOPLE[personKey]?.color;
  return validProfileColor(color) ? color : PROFILE_COLORS[personKey === "B" ? 1 : 0];
}

function firstGrapheme(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (Intl.Segmenter) return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)][0]?.segment || "";
  return Array.from(text)[0] || "";
}

function profileAvatar(profile, fallbackName = "") {
  if (profile?.avatarMode === "emoji" && profile.avatarEmoji) return firstGrapheme(profile.avatarEmoji);
  return firstGrapheme(profile?.name || fallbackName).toLocaleUpperCase(locale());
}

function personAvatar(personKey) {
  return profileAvatar(PEOPLE[personKey], subjectName(personKey)) || "?";
}

function historyAvatar(personKey) {
  const emojiClass = PEOPLE[personKey]?.avatarMode === "emoji" ? " avatar-emoji" : "";
  return `<i class="history-person-avatar${emojiClass}" style="--profile-color:${personColor(personKey)}">${escapeHtml(personAvatar(personKey))}</i>`;
}

function updateAvatarSettings() {
  const name = document.getElementById("settings-name").value.trim();
  const emojiInput = document.getElementById("settings-avatar-emoji");
  const avatar = SETTINGS_AVATAR_MODE === "emoji" && SETTINGS_AVATAR_EMOJI
    ? firstGrapheme(SETTINGS_AVATAR_EMOJI)
    : firstGrapheme(name).toLocaleUpperCase(locale()) || "?";
  const trigger = document.getElementById("settings-avatar-trigger");
  trigger.textContent = avatar;
  trigger.style.setProperty("--profile-color", SETTINGS_COLOR);
  trigger.classList.toggle("avatar-emoji", SETTINGS_AVATAR_MODE === "emoji" && Boolean(SETTINGS_AVATAR_EMOJI));
  const modalPreview = document.getElementById("avatar-modal-preview");
  modalPreview.textContent = avatar;
  modalPreview.style.setProperty("--profile-color", SETTINGS_COLOR);
  modalPreview.classList.toggle("avatar-emoji", SETTINGS_AVATAR_MODE === "emoji" && Boolean(SETTINGS_AVATAR_EMOJI));
  document.getElementById("settings-avatar-emoji-panel").hidden = SETTINGS_AVATAR_MODE !== "emoji";
  emojiInput.value = SETTINGS_AVATAR_EMOJI;
  document.querySelectorAll("#settings-emoji-grid button").forEach((button) =>
    button.classList.toggle("active", button.dataset.emoji === SETTINGS_AVATAR_EMOJI));
  document.querySelectorAll("#settings-avatar-mode button").forEach((button) =>
    button.classList.toggle("active", button.dataset.avatarMode === SETTINGS_AVATAR_MODE));
}

function updateColorPicker() {
  document.querySelectorAll("#settings-color button").forEach((button) => {
    const active = button.dataset.color === SETTINGS_COLOR;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  updateAvatarSettings();
}

function applyTheme() {
  const effectiveTheme = THEME === "system" ? (systemTheme.matches ? "dark" : "light") : THEME;
  document.documentElement.dataset.theme = effectiveTheme;
  document.querySelector('meta[name="theme-color"]').content = effectiveTheme === "dark" ? "#121211" : "#efede9";
  document.querySelectorAll("#settings-theme button").forEach((button) =>
    button.classList.toggle("active", button.dataset.theme === THEME));
}
systemTheme.addEventListener("change", () => { if (THEME === "system") applyTheme(); });

function t(key, values = {}) {
  let text = TRANSLATIONS[LANGUAGE][key] || TRANSLATIONS.sv[key] || key;
  for (const [name, value] of Object.entries(values)) text = text.replace(`{${name}}`, value);
  return text;
}

function applyLanguage() {
  document.documentElement.lang = LANGUAGE;
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => { element.title = t(element.dataset.i18nTitle); });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => { element.setAttribute("aria-label", t(element.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-alt]").forEach((element) => { element.alt = t(element.dataset.i18nAlt); });
  document.querySelectorAll("#settings-language button").forEach((button) =>
    button.classList.toggle("active", button.dataset.language === LANGUAGE));
  applyTheme();
  updateAuthLabels();
  if (APP_INITIALIZED) {
    updatePersonLabels();
    onEntryTypeChange(getEntryType());
    render();
  }
}

// ============================================================
//  STORAGE LAYER
//  Firebase (real-time sync) when config.js is filled in,
//  otherwise localStorage so the app works on a single device.
// ============================================================
let store; // { subscribe(cb), add(entry), update(id, entry), remove(id) }

async function initStore() {
  const col = fs.collection(db, "bankbooks", activeBankbook.id, "entries");
  const receipts = fs.collection(db, "bankbooks", activeBankbook.id, "receipts");
  store = {
    subscribe(cb) {
      const q = fs.query(col, fs.orderBy("ts", "desc"));
      return fs.onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => { console.error(err); setSync(false, t("syncFailed")); });
    },
    async add(entry) {
      const documentRef = await fs.addDoc(col, { ...entry, updatedBy: signedInUser.uid });
      return documentRef.id;
    },
    async update(id, entry) { await fs.updateDoc(fs.doc(col, id), { ...entry, updatedBy: signedInUser.uid }); },
    async remove(id) {
      await fs.deleteDoc(fs.doc(receipts, id));
      await fs.deleteDoc(fs.doc(col, id));
    },
    async getReceipt(id) {
      const snapshot = await fs.getDoc(fs.doc(receipts, id));
      return snapshot.exists() ? snapshot.data().imageData || "" : "";
    },
    async saveReceipt(id, imageData) {
      await fs.setDoc(fs.doc(receipts, id), {
        imageData,
        updatedBy: signedInUser.uid,
        updatedAt: Date.now(),
      });
    },
    async removeReceipt(id) { await fs.deleteDoc(fs.doc(receipts, id)); },
  };
  setSync(true, t("synced"));
}

function setSync(ok, title) {
  const dot = document.getElementById("sync-dot");
  dot.style.color = ok ? "#93a986" : "#c56b6b";
  if (title) dot.title = title;
}

// ============================================================
//  BALANCE MODEL
//  Each expense stores `split` = whose cost it is:
//    'a' = 100% Helo, 'even' = 50/50, 'b' = 100% Halvis.
//  The payer fronts the other person's share, so the other owes it.
//  balance > 0  →  B (Halvis) owes A (Helo).
// ============================================================
function sharesOf(e) {
  if (e.split === "a") return { a: e.amount, b: 0 };        // Helo bears all
  if (e.split === "b") return { a: 0, b: e.amount };        // Halvis bears all
  if (e.split === "custom") {
    const shareA = Math.min(1, Math.max(0, Number(e.shareA) || 0));
    return { a: e.amount * shareA, b: e.amount * (1 - shareA) };
  }
  return { a: e.amount / 2, b: e.amount / 2 };              // 50/50
}

function balanceOf(entries) {
  let bal = 0;
  for (const e of entries) {
    if (e.type === "settlement") {
      bal += (e.payer === "A" ? 1 : -1) * e.amount;
    } else if (e.type === "income") {
      const s = sharesOf(e);
      bal += e.payer === "A" ? -s.b : s.a; // recipient holds the other person's share
    } else {
      const s = sharesOf(e);
      bal += e.payer === "A" ? s.b : -s.a; // other person's share the payer covered
    }
  }
  return Math.round(bal * 100) / 100;
}

const locale = () => LANGUAGE === "en" ? "en-SE" : "sv-SE";
const kr = (n) =>
  new Intl.NumberFormat(locale(), { style: "currency", currency: "SEK", maximumFractionDigits: 2 }).format(n);
const kr0 = (n) =>
  new Intl.NumberFormat(locale(), { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(n);

// ============================================================
//  RENDER
// ============================================================
let ENTRIES = [];
let CURRENT_USER = localStorage.getItem("bankboken-person");
let APP_INITIALIZED = false;
let HISTORY_FILTER = null;
let HISTORY_PAGE = 1;
let OPEN_SWIPE_ROW = null;
const HISTORY_PAGE_SIZE = 10;

function subjectName(personKey) {
  return personKey === CURRENT_USER ? t("you") : PEOPLE[personKey].name;
}

function objectName(personKey) {
  return personKey === CURRENT_USER ? t("youObject") : PEOPLE[personKey].name;
}

function otherPersonKey(personKey = CURRENT_USER) {
  return personKey === "A" ? "B" : "A";
}

function splitLabel(entry) {
  const leftKey = CURRENT_USER;
  const rightKey = otherPersonKey();
  const sharePercent = (personKey) => Math.round(
    (personKey === "A" ? (entry.shareA || 0) : 1 - (entry.shareA || 0)) * 100,
  );
  if (entry.split === "a") return `100% ${subjectName("A")}`;
  if (entry.split === "b") return `100% ${subjectName("B")}`;
  if (entry.split === "custom") return `${sharePercent(leftKey)}/${sharePercent(rightKey)}`;
  return "50/50";
}

function render() { renderBalance(); renderHistory(); }

function closeSwipeRow(row = OPEN_SWIPE_ROW) {
  if (!row) return;
  row.classList.remove("swipe-open", "swiping");
  row.querySelector(".history-row-content")?.style.removeProperty("transform");
  if (OPEN_SWIPE_ROW === row) OPEN_SWIPE_ROW = null;
}

function makeSwipeableRow(row, entry, onOpen) {
  const content = document.createElement("div");
  content.className = "history-row-content";
  while (row.firstChild) content.appendChild(row.firstChild);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "swipe-delete";
  deleteButton.setAttribute("aria-label", t("delete"));
  deleteButton.innerHTML = '<img src="trash.svg" alt="" />';
  deleteButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    if (!confirm(t("deleteEntry"))) return;
    closeSwipeRow(row);
    await store.remove(entry.id);
  });

  row.classList.add("history-row");
  row.replaceChildren(deleteButton, content);

  let startX = 0;
  let startY = 0;
  let dragged = false;
  let horizontal = false;
  let directionDecided = false;
  const revealWidth = 84;

  content.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    if (OPEN_SWIPE_ROW && OPEN_SWIPE_ROW !== row) closeSwipeRow();
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
    dragged = false;
    horizontal = false;
    directionDecided = false;
    row.classList.add("swiping");
  }, { passive: true });

  content.addEventListener("touchmove", (event) => {
    if (event.touches.length !== 1) return;
    const deltaX = event.touches[0].clientX - startX;
    const deltaY = event.touches[0].clientY - startY;
    if (!directionDecided && (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8)) {
      directionDecided = true;
      horizontal = Math.abs(deltaX) > Math.abs(deltaY);
    }
    if (!horizontal) return;
    event.preventDefault();
    dragged = true;
    const base = row.classList.contains("swipe-open") ? -revealWidth : 0;
    const offset = Math.max(-revealWidth, Math.min(0, base + deltaX));
    content.style.transform = `translateX(${offset}px)`;
  }, { passive: false });

  content.addEventListener("touchend", () => {
    row.classList.remove("swiping");
    if (!dragged) return;
    const transform = content.style.transform;
    const offset = Number(transform.match(/-?\d+(?:\.\d+)?/)?.[0] || 0);
    content.style.removeProperty("transform");
    if (dragged && offset < -revealWidth / 2) {
      row.classList.add("swipe-open");
      OPEN_SWIPE_ROW = row;
    } else {
      closeSwipeRow(row);
    }
  }, { passive: true });

  content.addEventListener("click", (event) => {
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
      return;
    }
    if (row.classList.contains("swipe-open")) {
      event.preventDefault();
      event.stopPropagation();
      closeSwipeRow(row);
      return;
    }
    onOpen?.();
  });

  return content;
}

function renderBalance() {
  const bal = balanceOf(ENTRIES);
  const heading = document.getElementById("balance-heading");
  const sub = document.getElementById("balance-sub");
  const btn = document.getElementById("settle-btn");
  const panel = document.getElementById("settle-panel");

  panel.hidden = true;
  btn.hidden = true;
  if (Math.abs(bal) < 0.01) {
    heading.textContent = kr(0);
    sub.textContent = t("allEven");
    return;
  }

  const debtorKey = bal > 0 ? "B" : "A";
  const creditorKey = bal > 0 ? "A" : "B";
  const creditor = PEOPLE[creditorKey];
  const owed = Math.abs(bal);

  heading.textContent = kr(CURRENT_USER === debtorKey ? -owed : owed);
  const owesVerb = t(debtorKey === CURRENT_USER ? "oweSelf" : "owesOther");
  sub.innerHTML = `<strong>${escapeHtml(subjectName(debtorKey))}</strong> ${owesVerb} ${escapeHtml(objectName(creditorKey))}`;
  if (CURRENT_USER !== debtorKey) return;

  btn.hidden = false;
  btn.dataset.payee = creditor.swish;
  btn.dataset.amount = owed.toFixed(2);
}

function renderHistory() {
  const list = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  const totals = document.getElementById("totals");
  const pagination = document.getElementById("history-pagination");
  list.innerHTML = "";

  const hasEntries = ENTRIES.length > 0;
  totals.hidden = !hasEntries;
  totals.classList.toggle("is-filtered", Boolean(HISTORY_FILTER));

  if (hasEntries) {
    const sum = (who) =>
      ENTRIES.filter((e) => e.type === "expense" && e.payer === who).reduce((s, e) => s + e.amount, 0);
    const amounts = { A: sum("A"), B: sum("B") };
    const leftKey = CURRENT_USER;
    const rightKey = otherPersonKey();
    totals.innerHTML = `
      <button type="button" data-filter="${leftKey}" class="${HISTORY_FILTER === leftKey ? "active" : ""}" aria-pressed="${HISTORY_FILTER === leftKey}"><span class="total-label"><i class="profile-dot" style="--profile-color:${personColor(leftKey)}"></i>${subjectName(leftKey)}</span><b>${kr0(amounts[leftKey])}</b></button>
      <button type="button" data-filter="${rightKey}" class="${HISTORY_FILTER === rightKey ? "active" : ""}" aria-pressed="${HISTORY_FILTER === rightKey}"><span class="total-label"><i class="profile-dot" style="--profile-color:${personColor(rightKey)}"></i>${subjectName(rightKey)}</span><b>${kr0(amounts[rightKey])}</b></button>
      <button type="button" data-filter="all">${t("total")}<b>${kr0(amounts.A + amounts.B)}</b></button>`;
  }

  const visibleEntries = HISTORY_FILTER
    ? ENTRIES.filter((entry) => entry.type !== "settlement" && entry.payer === HISTORY_FILTER)
    : ENTRIES;
  empty.hidden = visibleEntries.length > 0;
  empty.textContent = HISTORY_FILTER
    ? t("noEntriesFor", { name: subjectName(HISTORY_FILTER) })
    : t("noEntries");

  const pageCount = Math.max(1, Math.ceil(visibleEntries.length / HISTORY_PAGE_SIZE));
  HISTORY_PAGE = Math.min(HISTORY_PAGE, pageCount);
  const pageStart = (HISTORY_PAGE - 1) * HISTORY_PAGE_SIZE;
  const pageEntries = visibleEntries.slice(pageStart, pageStart + HISTORY_PAGE_SIZE);
  pagination.hidden = visibleEntries.length <= HISTORY_PAGE_SIZE;
  document.getElementById("history-page-status").textContent = t("page", { page: HISTORY_PAGE, count: pageCount });
  document.getElementById("history-prev").disabled = HISTORY_PAGE === 1;
  document.getElementById("history-next").disabled = HISTORY_PAGE === pageCount;

  let renderedDate = null;
  for (const e of pageEntries) {
    const li = document.createElement("li");
    const date = new Date(e.ts).toLocaleDateString(locale(), { day: "numeric", month: "long" });

    if (date !== renderedDate) {
      const marker = document.createElement("li");
      marker.className = "history-date-marker";
      marker.textContent = date;
      list.appendChild(marker);
      renderedDate = date;
    }

    if (e.type === "settlement") {
      const recipientKey = e.payer === "A" ? "B" : "A";
      const to = objectName(recipientKey);
      li.className = "h-settle";
      li.innerHTML = `
        <div class="h-ico">💸</div>
        <div class="h-main">
          <div class="h-title">${t("settlement")}</div>
          <div class="h-sub">${historyAvatar(e.payer)}<span>→ ${to}</span></div>
        </div>
        <div class="h-amt">${kr(e.amount)}</div>`;
    } else if (e.type === "income") {
      li.className = "h-income";
      li.innerHTML = `
        <div class="h-ico">${e.icon || "💰"}</div>
        <div class="h-main">
          <div class="h-title">${escapeHtml(e.desc)}</div>
          <div class="h-sub">${historyAvatar(e.payer)}<span>${t("received")} · ${splitLabel(e)}</span></div>
        </div>
        <div class="h-amt">+${kr(e.amount)}</div>`;
    } else {
      const shares = sharesOf(e);
      const payerShare = e.payer === "A" ? shares.a : shares.b;
      const historyCopy = Math.abs(payerShare - e.amount) < 0.01
        ? t("treated", { recipient: objectName(otherPersonKey(e.payer)) })
        : splitLabel(e);
      li.innerHTML = `
        <div class="h-ico">${e.icon || "🧾"}</div>
        <div class="h-main">
          <div class="h-title">${escapeHtml(e.desc)}</div>
          <div class="h-sub">${historyAvatar(e.payer)}<span>${historyCopy}</span></div>
        </div>
        <div class="h-amt">${kr(e.amount)}</div>`;
    }
    const openEntry = e.type !== "settlement" ? () => startEditing(e) : null;
    const content = makeSwipeableRow(li, e, openEntry);
    if (e.type !== "settlement") {
      li.classList.add("h-expense");
      content.tabIndex = 0;
      content.setAttribute("role", "button");
      content.setAttribute("aria-label", `Redigera ${e.desc}`);
      content.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startEditing(e);
        }
      };
    }
    list.appendChild(li);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ============================================================
//  SWISH
// ============================================================
const settlementMessage = () => {
  const date = new Intl.DateTimeFormat(locale(), { day: "numeric", month: "long" }).format(new Date());
  return `Split Happens - ${t("settlement").toLowerCase()} ${date}`;
};

const buildSwishLink = (payee, amount, msg) =>
  `https://app.swish.nu/1/p/sw/?sw=${encodeURIComponent(payee)}` +
  `&amt=${encodeURIComponent(amount)}&cur=SEK&msg=${encodeURIComponent(msg)}`;

function onSettleClick() {
  const btn = document.getElementById("settle-btn");
  if (btn.hidden) return;
  const { payee, amount } = btn.dataset;
  const link = buildSwishLink(payee, amount, settlementMessage());

  document.getElementById("settle-panel").hidden = false;
  window.open(link, "_blank", "noopener,noreferrer");
}

async function confirmSettlement() {
  const bal = balanceOf(ENTRIES);
  if (Math.abs(bal) < 0.01) return;
  const payer = bal > 0 ? "B" : "A";
  if (CURRENT_USER !== payer) return;
  await store.add({
    type: "settlement", payer, amount: Math.abs(bal), ts: Date.now(),
  });
  document.getElementById("settle-panel").hidden = true;
  document.getElementById("saldo-card").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
//  FORM
// ============================================================
function initSegments(id, onChange, key = "val") {
  const seg = document.getElementById(id);
  seg.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    seg.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    onChange?.(btn.dataset[key]);
  });
  return () => seg.querySelector(".active").dataset[key];
}
function setActive(segId, val, key = "val") {
  document.querySelectorAll(`#${segId} button`).forEach((b) =>
    b.classList.toggle("active", b.dataset[key] === val));
}

let getEntryType, getPayer, getSplit;
let EDITING_ID = null;
let EDITING_ORIGINAL = null;
let EDITING_HAS_RECEIPT = false;
let pendingReceiptData = "";
let pendingReceiptUrl = "";
let removeExistingReceipt = false;
const receiptPointers = new Map();
let receiptView = { scale: 1, x: 0, y: 0 };
let receiptGesture = null;

// ---- category icon popup ----
const ICON_DEFAULT = "🧾"; // receipt is the default category
const INCOME_ICON_DEFAULT = "💰";
let selectedIcon = ICON_DEFAULT;

function getIcon() { return selectedIcon; }

function setIcon(icon) {
  selectedIcon = icon;
  document.getElementById("icon-trigger").textContent = icon;
  document.querySelectorAll("#icon-pop button").forEach((b) =>
    b.classList.toggle("active", b.dataset.icon === icon));
  updateEditingDirtyState();
}

function closeIconPop() {
  document.getElementById("icon-pop").hidden = true;
  document.getElementById("icon-trigger").setAttribute("aria-expanded", "false");
}

function updateDefaultIconOption(type) {
  const isIncome = type === "income";
  const nextDefault = isIncome ? INCOME_ICON_DEFAULT : ICON_DEFAULT;
  const previousDefault = isIncome ? ICON_DEFAULT : INCOME_ICON_DEFAULT;
  const option = document.getElementById("icon-default-option");
  option.dataset.icon = nextDefault;
  option.title = isIncome ? t("incomeIcon") : t("otherIcon");
  option.textContent = nextDefault;
  setIcon(getIcon() === previousDefault ? nextDefault : getIcon());
}

function initIconPicker() {
  const trigger = document.getElementById("icon-trigger");
  const pop = document.getElementById("icon-pop");
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = pop.hidden;
    pop.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
  });
  pop.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    setIcon(b.dataset.icon);
    closeIconPop();
  });
  document.addEventListener("click", (e) => {
    if (!pop.hidden && !pop.contains(e.target) && e.target !== trigger) closeIconPop();
  });
  setIcon(ICON_DEFAULT); // receipt by default
}

function payerKey() { return getPayer(); }
function currentPersonName() { return CURRENT_USER || "A"; }

function updatePersonLabels() {
  const leftKey = CURRENT_USER;
  const rightKey = otherPersonKey();
  const payer = document.getElementById("e-payer");
  const leftPayerButton = payer.querySelector(`[data-val="${leftKey}"]`);
  const rightPayerButton = payer.querySelector(`[data-val="${rightKey}"]`);
  leftPayerButton.textContent = t("payerYou");
  rightPayerButton.textContent = subjectName(rightKey);
  leftPayerButton.classList.add("person-option");
  rightPayerButton.classList.add("person-option");
  leftPayerButton.style.setProperty("--profile-color", personColor(leftKey));
  rightPayerButton.style.setProperty("--profile-color", personColor(rightKey));
  leftPayerButton.style.setProperty("--profile-avatar", JSON.stringify(personAvatar(leftKey)));
  rightPayerButton.style.setProperty("--profile-avatar", JSON.stringify(personAvatar(rightKey)));
  leftPayerButton.style.setProperty("--profile-avatar-size", PEOPLE[leftKey]?.avatarMode === "emoji" ? "0.78rem" : "0.7rem");
  rightPayerButton.style.setProperty("--profile-avatar-size", PEOPLE[rightKey]?.avatarMode === "emoji" ? "0.78rem" : "0.7rem");
  payer.append(leftPayerButton, rightPayerButton);

  const presets = document.querySelector("#e-split .split-presets");
  const leftSplit = leftKey === "A" ? "a" : "b";
  const rightSplit = rightKey === "A" ? "a" : "b";
  const leftSplitButton = presets.querySelector(`[data-val="${leftSplit}"]`);
  const evenButton = presets.querySelector('[data-val="even"]');
  const rightSplitButton = presets.querySelector(`[data-val="${rightSplit}"]`);
  leftSplitButton.textContent = subjectName(leftKey);
  rightSplitButton.textContent = subjectName(rightKey);
  leftSplitButton.classList.add("person-option");
  rightSplitButton.classList.add("person-option");
  leftSplitButton.style.setProperty("--profile-color", personColor(leftKey));
  rightSplitButton.style.setProperty("--profile-color", personColor(rightKey));
  leftSplitButton.style.setProperty("--profile-avatar", JSON.stringify(personAvatar(leftKey)));
  rightSplitButton.style.setProperty("--profile-avatar", JSON.stringify(personAvatar(rightKey)));
  leftSplitButton.style.setProperty("--profile-avatar-size", PEOPLE[leftKey]?.avatarMode === "emoji" ? "0.78rem" : "0.7rem");
  rightSplitButton.style.setProperty("--profile-avatar-size", PEOPLE[rightKey]?.avatarMode === "emoji" ? "0.78rem" : "0.7rem");
  presets.append(leftSplitButton, evenButton, rightSplitButton);
  updateCustomSplitLabels();
}

function customShareA() {
  const rightShare = Number(document.getElementById("e-custom-share").value) / 100;
  return CURRENT_USER === "A" ? 1 - rightShare : rightShare;
}

function updateCustomSplitLabels() {
  const slider = document.getElementById("e-custom-share");
  const sliderPosition = Number(slider.value);
  const fillStart = Math.min(50, sliderPosition);
  const fillEnd = Math.max(50, sliderPosition);
  slider.style.background = `linear-gradient(to right, var(--ink-3) 0 ${fillStart}%, var(--ink) ${fillStart}% ${fillEnd}%, var(--ink-3) ${fillEnd}% 100%)`;
  const percentA = Math.round(customShareA() * 100);
  const percentages = { A: percentA, B: 100 - percentA };
  const leftKey = CURRENT_USER;
  const rightKey = otherPersonKey();
  const amount = parseFloat(document.getElementById("e-amount").value) || 0;
  document.getElementById("custom-a-name").textContent = subjectName(leftKey);
  document.getElementById("custom-b-name").textContent = subjectName(rightKey);
  document.getElementById("custom-a-value").textContent = `${percentages[leftKey]}% · ${kr(amount * percentages[leftKey] / 100)}`;
  document.getElementById("custom-b-value").textContent = `${percentages[rightKey]}% · ${kr(amount * percentages[rightKey] / 100)}`;
}

function onSplitChange(split) {
  document.getElementById("custom-split").hidden = split !== "custom";
  updatePreview();
}

function onEntryTypeChange(type) {
  const isIncome = type === "income";
  document.getElementById("expense-heading").textContent = EDITING_ID
    ? t(isIncome ? "editIncome" : "editExpense")
    : t("add");
  document.getElementById("edit-modal-title").textContent = t(isIncome ? "editIncome" : "editExpense");
  document.getElementById("payer-label").textContent = t(isIncome ? "receivedBy" : "paidBy");
  document.getElementById("submit-label").textContent = EDITING_ID
    ? t("save")
    : t(isIncome ? "addIncome" : "addExpense");
  updateDefaultIconOption(type);
  updatePreview();
}

function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function expenseTimestamp(dateValue, previousTimestamp = null) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const now = previousTimestamp ? new Date(previousTimestamp) : new Date();
  return new Date(
    year, month - 1, day,
    now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds(),
  ).getTime();
}

function dateInputValue(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function editingFormState() {
  if (!EDITING_ID || !getEntryType || !getPayer || !getSplit) return null;
  return JSON.stringify({
    type: getEntryType(),
    description: document.getElementById("e-desc").value.trim(),
    amount: document.getElementById("e-amount").value,
    date: document.getElementById("e-date").value,
    payer: getPayer(),
    split: getSplit(),
    customShare: document.getElementById("e-custom-share").value,
    icon: getIcon(),
    receiptAction: pendingReceiptData ? "replace" : (removeExistingReceipt ? "remove" : "keep"),
  });
}

function updateEditingDirtyState() {
  const submit = document.querySelector("#expense-form button[type='submit']");
  if (!submit) return;
  submit.disabled = Boolean(EDITING_ID) && (!EDITING_ORIGINAL || editingFormState() === EDITING_ORIGINAL);
}

function clearPendingReceiptUrl() {
  if (pendingReceiptUrl.startsWith("blob:")) URL.revokeObjectURL(pendingReceiptUrl);
  pendingReceiptUrl = "";
}

function showReceiptError(message = "") {
  const error = document.getElementById("receipt-error");
  error.textContent = message;
  error.hidden = !message;
}

function renderReceiptPreview(url = "") {
  const preview = document.getElementById("receipt-preview");
  const picker = document.querySelector(".receipt-picker");
  const image = document.getElementById("receipt-image");
  preview.hidden = !url;
  picker.hidden = Boolean(url);
  image.removeAttribute("src");
  if (url) image.src = url;
}

function constrainReceiptView() {
  const stage = document.getElementById("receipt-lightbox-stage");
  const image = document.getElementById("receipt-lightbox-image");
  receiptView.scale = Math.min(5, Math.max(1, receiptView.scale));
  if (receiptView.scale === 1) {
    receiptView.x = 0;
    receiptView.y = 0;
    return;
  }
  const maxX = Math.max(0, (image.clientWidth * receiptView.scale - stage.clientWidth) / 2);
  const maxY = Math.max(0, (image.clientHeight * receiptView.scale - stage.clientHeight) / 2);
  receiptView.x = Math.min(maxX, Math.max(-maxX, receiptView.x));
  receiptView.y = Math.min(maxY, Math.max(-maxY, receiptView.y));
}

function applyReceiptView() {
  constrainReceiptView();
  document.getElementById("receipt-lightbox-image").style.transform =
    `translate3d(${receiptView.x}px, ${receiptView.y}px, 0) scale(${receiptView.scale})`;
}

function resetReceiptView() {
  receiptPointers.clear();
  receiptGesture = null;
  receiptView = { scale: 1, x: 0, y: 0 };
  applyReceiptView();
}

function receiptPoint(event) {
  return { x: event.clientX, y: event.clientY };
}

function receiptDistance(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function receiptMidpoint(first, second) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function startReceiptGesture() {
  const points = [...receiptPointers.values()];
  if (points.length < 2) {
    receiptGesture = null;
    return;
  }
  receiptGesture = {
    distance: Math.max(1, receiptDistance(points[0], points[1])),
    midpoint: receiptMidpoint(points[0], points[1]),
    scale: receiptView.scale,
    x: receiptView.x,
    y: receiptView.y,
  };
}

function openReceiptLightbox() {
  const source = document.getElementById("receipt-image").src;
  if (!source) return;
  const image = document.getElementById("receipt-lightbox-image");
  image.onload = resetReceiptView;
  image.src = source;
  document.getElementById("receipt-lightbox").hidden = false;
  resetReceiptView();
  document.getElementById("receipt-lightbox-close").focus();
}

function closeReceiptLightbox() {
  document.getElementById("receipt-lightbox").hidden = true;
  const image = document.getElementById("receipt-lightbox-image");
  image.onload = null;
  image.removeAttribute("src");
  resetReceiptView();
  document.getElementById("receipt-open").focus();
}

async function imageFromFile(file) {
  if ("createImageBitmap" in window) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasDataUrl(canvas, quality) {
  return canvas.toDataURL("image/jpeg", quality);
}

async function compressReceipt(file) {
  if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024) {
    throw new Error(file.size > 15 * 1024 * 1024 ? "too-large" : "invalid");
  }
  const image = await imageFromFile(file);
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close?.();
  let quality = 0.78;
  let imageData = canvasDataUrl(canvas, quality);
  while (imageData.length > 720000 && quality > 0.42) {
    quality -= 0.08;
    imageData = canvasDataUrl(canvas, quality);
  }
  if (imageData.length > 850000) throw new Error("too-large");
  return imageData;
}

function resetExpenseForm() {
  const form = document.getElementById("expense-form");
  document.getElementById("expense-form-home").appendChild(form);
  document.getElementById("edit-modal").hidden = true;
  EDITING_ID = null;
  EDITING_ORIGINAL = null;
  EDITING_HAS_RECEIPT = false;
  form.reset();
  setActive("e-type", "expense");
  document.getElementById("e-date").value = todayInputValue();
  setActive("e-payer", currentPersonName());
  setActive("e-split", "even");
  document.getElementById("e-custom-share").value = "50";
  document.getElementById("custom-split").hidden = true;
  document.getElementById("expense-heading").textContent = t("add");
  document.getElementById("submit-icon").textContent = "+";
  document.getElementById("submit-label").textContent = t("addExpense");
  document.getElementById("edit-cancel").hidden = true;
  document.getElementById("edit-delete").hidden = true;
  document.getElementById("e-receipt").value = "";
  pendingReceiptData = "";
  removeExistingReceipt = false;
  clearPendingReceiptUrl();
  renderReceiptPreview();
  showReceiptError();
  updateCustomSplitLabels();
  setIcon(ICON_DEFAULT);
  closeIconPop();
  updatePreview();
  onEntryTypeChange("expense");
  updateEditingDirtyState();
}

async function startEditing(entry) {
  EDITING_ID = entry.id;
  EDITING_ORIGINAL = null;
  EDITING_HAS_RECEIPT = Boolean(entry.hasReceipt);
  document.getElementById("edit-form-modal").appendChild(document.getElementById("expense-form"));
  document.getElementById("edit-modal").hidden = false;
  updateEditingDirtyState();
  document.getElementById("e-desc").value = entry.desc;
  document.getElementById("e-amount").value = entry.amount;
  document.getElementById("e-date").value = dateInputValue(entry.ts);
  setActive("e-type", entry.type === "income" ? "income" : "expense");
  setActive("e-payer", entry.payer);
  setActive("e-split", entry.split || "even");
  document.getElementById("e-custom-share").value = entry.split === "custom"
    ? String(Math.round((CURRENT_USER === "A" ? 1 - entry.shareA : entry.shareA) * 100))
    : "50";
  document.getElementById("custom-split").hidden = entry.split !== "custom";
  pendingReceiptData = "";
  removeExistingReceipt = false;
  clearPendingReceiptUrl();
  renderReceiptPreview();
  showReceiptError();
  setIcon(entry.icon || ICON_DEFAULT);
  document.getElementById("submit-icon").textContent = "✓";
  document.getElementById("submit-label").textContent = t("save");
  document.getElementById("edit-cancel").hidden = false;
  document.getElementById("edit-delete").hidden = false;
  updateCustomSplitLabels();
  updatePreview();
  onEntryTypeChange(entry.type === "income" ? "income" : "expense");
  EDITING_ORIGINAL = editingFormState();
  updateEditingDirtyState();
  if (entry.hasReceipt) {
    const receiptEntryId = entry.id;
    try {
      const imageData = await store.getReceipt(entry.id);
      if (EDITING_ID === receiptEntryId && !pendingReceiptData && !removeExistingReceipt) {
        renderReceiptPreview(imageData);
      }
    } catch (error) {
      console.error(error);
      showReceiptError(t("receiptInvalid"));
    }
  }
}

function updatePreview() {
  const amount = parseFloat(document.getElementById("e-amount").value) || 0;
  updateCustomSplitLabels();
  const type = getEntryType();
  const split = getSplit(); // 'a' | 'even' | 'b'
  const payer = payerKey();
  const other = payer === "A" ? "B" : "A";
  const el = document.getElementById("split-preview");

  if (amount <= 0) { el.hidden = true; return; }
  if (type === "income") {
    const shares = sharesOf({ amount, split, shareA: customShareA() });
    const otherShare = other === "A" ? shares.a : shares.b;
    el.hidden = false;
    el.textContent = otherShare <= 0
      ? t("entitledAll", { name: subjectName(payer) })
      : t("entitled", { name: subjectName(other), amount: kr(otherShare) });
    return;
  }
  const shares = sharesOf({ amount, split, shareA: customShareA() });
  const owes = payerKey() === "A" ? shares.b : shares.a; // what the non-payer owes
  el.hidden = false;
  el.textContent = owes <= 0
    ? t("noDebtFull", { name: subjectName(payer) })
    : t("becomesOwed", { name: subjectName(other), recipient: objectName(payer), amount: kr(owes) });
}

function initApp() {
  getEntryType = initSegments("e-type", (value) => {
    onEntryTypeChange(value);
    updateEditingDirtyState();
  });
  getPayer = initSegments("e-payer", () => {
    updatePreview();
    updateEditingDirtyState();
  });
  getSplit = initSegments("e-split", (value) => {
    onSplitChange(value);
    updateEditingDirtyState();
  });
  initIconPicker();

  const dateInput = document.getElementById("e-date");
  dateInput.value = todayInputValue();
  dateInput.addEventListener("change", () => {
    dateInput.blur();
    updateEditingDirtyState();
  });
  document.getElementById("expense-form").addEventListener("input", updateEditingDirtyState);

  document.getElementById("e-receipt").addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    showReceiptError();
    try {
      const imageData = await compressReceipt(file);
      clearPendingReceiptUrl();
      pendingReceiptData = imageData;
      pendingReceiptUrl = imageData;
      removeExistingReceipt = false;
      renderReceiptPreview(pendingReceiptUrl);
      updateEditingDirtyState();
    } catch (error) {
      event.target.value = "";
      showReceiptError(t(error.message === "too-large" ? "receiptTooLarge" : "receiptInvalid"));
    }
  });

  document.getElementById("receipt-remove").addEventListener("click", () => {
    document.getElementById("e-receipt").value = "";
    pendingReceiptData = "";
    removeExistingReceipt = Boolean(EDITING_ID && EDITING_HAS_RECEIPT);
    clearPendingReceiptUrl();
    renderReceiptPreview();
    showReceiptError();
    updateEditingDirtyState();
  });

  document.getElementById("receipt-open").addEventListener("click", openReceiptLightbox);
  document.getElementById("receipt-lightbox-close").addEventListener("click", closeReceiptLightbox);
  document.getElementById("receipt-lightbox").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeReceiptLightbox();
  });
  const receiptStage = document.getElementById("receipt-lightbox-stage");
  receiptStage.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    receiptStage.setPointerCapture(event.pointerId);
    const point = receiptPoint(event);
    receiptPointers.set(event.pointerId, {
      ...point,
      previousX: point.x,
      previousY: point.y,
    });
    if (receiptPointers.size >= 2) startReceiptGesture();
  });
  receiptStage.addEventListener("pointermove", (event) => {
    const pointer = receiptPointers.get(event.pointerId);
    if (!pointer) return;
    event.preventDefault();
    const point = receiptPoint(event);
    pointer.x = point.x;
    pointer.y = point.y;

    if (receiptPointers.size >= 2 && receiptGesture) {
      const points = [...receiptPointers.values()];
      const distance = Math.max(1, receiptDistance(points[0], points[1]));
      const midpoint = receiptMidpoint(points[0], points[1]);
      receiptView.scale = receiptGesture.scale * (distance / receiptGesture.distance);
      receiptView.x = receiptGesture.x + midpoint.x - receiptGesture.midpoint.x;
      receiptView.y = receiptGesture.y + midpoint.y - receiptGesture.midpoint.y;
    } else if (receiptPointers.size === 1 && receiptView.scale > 1) {
      receiptView.x += point.x - pointer.previousX;
      receiptView.y += point.y - pointer.previousY;
    }

    pointer.previousX = point.x;
    pointer.previousY = point.y;
    applyReceiptView();
  });
  const endReceiptPointer = (event) => {
    receiptPointers.delete(event.pointerId);
    if (receiptPointers.size >= 2) {
      startReceiptGesture();
      return;
    }
    receiptGesture = null;
    const remaining = [...receiptPointers.values()][0];
    if (remaining) {
      remaining.previousX = remaining.x;
      remaining.previousY = remaining.y;
    }
  };
  receiptStage.addEventListener("pointerup", endReceiptPointer);
  receiptStage.addEventListener("pointercancel", endReceiptPointer);
  receiptStage.addEventListener("dblclick", () => {
    receiptView = receiptView.scale > 1
      ? { scale: 1, x: 0, y: 0 }
      : { scale: 2, x: 0, y: 0 };
    applyReceiptView();
  });
  receiptStage.addEventListener("wheel", (event) => {
    event.preventDefault();
    receiptView.scale += event.deltaY < 0 ? 0.25 : -0.25;
    applyReceiptView();
  }, { passive: false });

  document.getElementById("e-amount").addEventListener("input", updatePreview);
  document.getElementById("e-custom-share").addEventListener("input", () => {
    updateCustomSplitLabels();
    updatePreview();
    updateEditingDirtyState();
  });

  // Config-driven labels
  updatePersonLabels();
  setActive("e-payer", currentPersonName());

  document.getElementById("expense-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const desc = document.getElementById("e-desc").value.trim();
    const amount = parseFloat(document.getElementById("e-amount").value);
    const date = dateInput.value;
    if (!desc || !(amount > 0) || !date) return;
    const type = getEntryType();
    const split = getSplit();
    const existingEntry = EDITING_ID ? ENTRIES.find((entry) => entry.id === EDITING_ID) : null;
    const expense = {
      type, desc, amount, icon: getIcon(),
      payer: payerKey(), split,
      shareA: split === "custom" ? customShareA() : null,
      ts: expenseTimestamp(date, existingEntry?.ts),
    };
    const submitButton = ev.submitter;
    submitButton.disabled = true;
    showReceiptError();
    let createdEntryId = "";
    try {
      const entryId = EDITING_ID || await store.add(expense);
      if (!EDITING_ID) createdEntryId = entryId;
      let hasReceipt = Boolean(existingEntry?.hasReceipt);
      if (pendingReceiptData) {
        await store.saveReceipt(entryId, pendingReceiptData);
        hasReceipt = true;
      } else if (removeExistingReceipt) {
        await store.removeReceipt(entryId);
        hasReceipt = false;
      }
      if (EDITING_ID || pendingReceiptData || removeExistingReceipt) {
        await store.update(entryId, { ...expense, hasReceipt });
      }
      resetExpenseForm();
      document.getElementById("saldo-card").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error(error);
      if (createdEntryId) {
        try {
          await store.remove(createdEntryId);
        } catch (cleanupError) {
          console.error(cleanupError);
        }
      }
      showReceiptError(t("receiptUploadFailed"));
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById("edit-cancel").addEventListener("click", resetExpenseForm);
  document.getElementById("edit-delete").addEventListener("click", async () => {
    const entry = ENTRIES.find((item) => item.id === EDITING_ID);
    if (!EDITING_ID || !confirm(t("deleteEntry"))) return;
    await store.remove(EDITING_ID);
    resetExpenseForm();
  });

  document.getElementById("edit-modal").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) resetExpenseForm();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.getElementById("receipt-lightbox").hidden) {
      closeReceiptLightbox();
      return;
    }
    if (event.key === "Escape" && !document.getElementById("edit-modal").hidden) resetExpenseForm();
  });

  document.getElementById("totals").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    const filter = button.dataset.filter;
    HISTORY_FILTER = filter === "all" || HISTORY_FILTER === filter ? null : filter;
    HISTORY_PAGE = 1;
    renderHistory();
  });

  document.getElementById("history-prev").addEventListener("click", () => {
    if (HISTORY_PAGE <= 1) return;
    HISTORY_PAGE -= 1;
    renderHistory();
    document.getElementById("totals").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("history-next").addEventListener("click", () => {
    HISTORY_PAGE += 1;
    renderHistory();
    document.getElementById("totals").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("settle-btn").addEventListener("click", onSettleClick);
  document.getElementById("confirm-settle").addEventListener("click", confirmSettlement);
}

// ============================================================
//  ACCOUNTS AND BANKBOOKS
// ============================================================
let registrationMode = false;
let profileCompletionMode = false;
let userProfile;

function showOnly(screenId) {
  for (const id of ["auth-screen", "bankbook-screen", "app"]) {
    document.getElementById(id).hidden = id !== screenId;
  }
}

function showError(elementId, error) {
  const element = document.getElementById(elementId);
  const messages = LANGUAGE === "en" ? {
    "auth/email-already-in-use": "An account already exists with that email address.",
    "auth/invalid-credential": "Incorrect email address or password.",
    "auth/weak-password": "The password must contain at least 6 characters.",
    "auth/configuration-not-found": "Login is not enabled in Firebase yet. Enable Email/Password under Authentication → Sign-in method.",
    "permission-denied": "The Firestore rules for Split Happens have not been published yet.",
  } : {
    "auth/email-already-in-use": "Det finns redan ett konto med den e-postadressen.",
    "auth/invalid-credential": "Fel e-postadress eller lösenord.",
    "auth/weak-password": "Lösenordet måste innehålla minst 6 tecken.",
    "auth/configuration-not-found": "Inloggning är inte aktiverad i Firebase ännu. Aktivera Email/Password under Authentication → Sign-in method.",
    "permission-denied": "Firestore-reglerna för Split Happens är inte publicerade ännu.",
  };
  const fallback = LANGUAGE === "en" ? "Something went wrong. Please try again." : "Något gick fel. Försök igen.";
  element.textContent = messages[error?.code] || error?.message || fallback;
  element.hidden = false;
}

function normalizeSwish(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `46${digits.slice(1)}`;
  return digits;
}

async function loadProfile(uid) {
  const snapshot = await fs.getDoc(fs.doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

async function loadBankbooks() {
  const q = fs.query(fs.collection(db, "bankbooks"), fs.where("memberIds", "array-contains", signedInUser.uid));
  const snapshot = await fs.getDocs(q);
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
}

function pendingInviteId() {
  return new URL(window.location.href).searchParams.get("invite")?.trim() || "";
}

function parseInvite(value) {
  const trimmed = value.trim();
  try {
    return new URL(trimmed).searchParams.get("invite")?.trim() || trimmed;
  } catch {
    return trimmed;
  }
}

function invitationUrl(bankbookId) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("invite", bankbookId);
  return url.toString();
}

function renderWaitingRoom(bankbook) {
  showOnly("bankbook-screen");
  document.getElementById("welcome-name").textContent = t("welcomeWaiting", { name: userProfile.name });
  document.getElementById("invite-panel").hidden = false;
  document.getElementById("join-bankbook-form").hidden = true;
  document.getElementById("invite-link").value = invitationUrl(bankbook.id);
  watchWaitingRoom(bankbook.id);
}

function watchWaitingRoom(bankbookId) {
  if (unsubscribeWaitingRoom) unsubscribeWaitingRoom();
  const reference = fs.doc(db, "bankbooks", bankbookId);
  unsubscribeWaitingRoom = fs.onSnapshot(reference, async (snapshot) => {
    if (!snapshot.exists() || openingBankbook) return;
    const updatedBankbook = { id: snapshot.id, ...snapshot.data() };
    if (updatedBankbook.memberIds.length < 2 || !peopleFromBankbook(updatedBankbook)) return;
    openingBankbook = true;
    unsubscribeWaitingRoom();
    unsubscribeWaitingRoom = null;
    await openBankbook(updatedBankbook);
    openingBankbook = false;
  }, (error) => showError("bankbook-error", error));
}

async function refreshBankbookMenu(autoOpen = true) {
  const bankbooks = await loadBankbooks();
  const inviteId = pendingInviteId();
  if (bankbooks.length > 0) {
    const bankbook = bankbooks[0];
    if (inviteId && inviteId !== bankbook.id) {
      showOnly("bankbook-screen");
      showError("bankbook-error", new Error("Kontot är redan kopplat till en annan delning."));
      return;
    }
    if (bankbook.memberIds.length === 2 && autoOpen) {
      await openBankbook(bankbook);
    } else {
      renderWaitingRoom(bankbook);
    }
    return;
  }
  if (inviteId) {
    document.getElementById("invite-code").value = inviteId;
    await joinBankbook(inviteId);
    return;
  }
  const bankbook = await createAutomaticBankbook();
  renderWaitingRoom(bankbook);
}

async function createAutomaticBankbook() {
  const reference = fs.doc(fs.collection(db, "bankbooks"));
  const bankbook = {
    name: "Split Happens",
    createdBy: signedInUser.uid,
    memberIds: [signedInUser.uid],
    members: {
      [signedInUser.uid]: {
        name: userProfile.name,
        swish: userProfile.swish,
        color: userProfile.color || defaultProfileColor(signedInUser.uid),
        avatarMode: userProfile.avatarMode || "letter",
        avatarEmoji: userProfile.avatarEmoji || "",
        slot: "A",
      },
    },
    createdAt: fs.serverTimestamp(),
  };
  await fs.setDoc(reference, bankbook);
  return { id: reference.id, ...bankbook };
}

function peopleFromBankbook(bankbook) {
  const profiles = Object.entries(bankbook.members || {});
  const personA = profiles.find(([, profile]) => profile.slot === "A");
  const personB = profiles.find(([, profile]) => profile.slot === "B");
  if (!personA || !personB) return null;
  return {
    people: {
      A: {
        ...personA[1],
        color: validProfileColor(personA[1].color) ? personA[1].color : PROFILE_COLORS[0],
        avatarMode: personA[1].avatarMode === "emoji" ? "emoji" : "letter",
        avatarEmoji: personA[1].avatarEmoji || "",
      },
      B: {
        ...personB[1],
        color: validProfileColor(personB[1].color) ? personB[1].color : PROFILE_COLORS[1],
        avatarMode: personB[1].avatarMode === "emoji" ? "emoji" : "letter",
        avatarEmoji: personB[1].avatarEmoji || "",
      },
    },
    currentSlot: personA[0] === signedInUser.uid ? "A" : "B",
  };
}

async function openBankbook(bankbook) {
  const people = peopleFromBankbook(bankbook);
  if (!people) return renderWaitingRoom(bankbook);
  if (unsubscribeWaitingRoom) {
    unsubscribeWaitingRoom();
    unsubscribeWaitingRoom = null;
  }
  activeBankbook = bankbook;
  PEOPLE = people.people;
  CURRENT_USER = people.currentSlot;
  localStorage.setItem(`bankboken-active-${signedInUser.uid}`, bankbook.id);
  document.querySelector(".brand").title = bankbook.name;
  ENTRIES = [];
  HISTORY_FILTER = null;
  HISTORY_PAGE = 1;
  if (unsubscribeEntries) unsubscribeEntries();
  await initStore();
  if (!APP_INITIALIZED) {
    initApp();
    APP_INITIALIZED = true;
  } else {
    updatePersonLabels();
    resetExpenseForm();
  }
  unsubscribeEntries = store.subscribe((entries) => { ENTRIES = entries; render(); });
  watchActiveBankbook(bankbook.id);
  showOnly("app");
}

function watchActiveBankbook(bankbookId) {
  if (unsubscribeActiveBankbook) unsubscribeActiveBankbook();
  unsubscribeActiveBankbook = fs.onSnapshot(fs.doc(db, "bankbooks", bankbookId), (snapshot) => {
    if (!snapshot.exists()) return;
    const updatedBankbook = { id: snapshot.id, ...snapshot.data() };
    const people = peopleFromBankbook(updatedBankbook);
    if (!people) return;
    activeBankbook = updatedBankbook;
    PEOPLE = people.people;
    CURRENT_USER = people.currentSlot;
    if (APP_INITIALIZED) {
      updatePersonLabels();
      updatePreview();
      render();
    }
  }, (error) => setSync(false, error.message));
}

function updateAuthLabels() {
  document.querySelector(".auth-card .auth-intro").textContent = t(registrationMode ? "authRegisterIntro" : "authIntro");
  if (profileCompletionMode) {
    document.getElementById("auth-submit").textContent = t("completeAccount");
    document.getElementById("auth-mode").textContent = t("switchAccount");
    return;
  }
  document.getElementById("auth-submit").textContent = t(registrationMode ? "createAccountShort" : "login");
  document.getElementById("auth-mode").textContent = t(registrationMode ? "alreadyAccount" : "createAccount");
  if (!document.getElementById("auth-reset").disabled) document.getElementById("auth-reset").textContent = t("forgotPassword");
}

document.getElementById("auth-mode").addEventListener("click", () => {
  if (profileCompletionMode) {
    authApi.signOut(auth);
    return;
  }
  registrationMode = !registrationMode;
  document.getElementById("auth-name").hidden = !registrationMode;
  document.getElementById("auth-swish").hidden = !registrationMode;
  document.getElementById("auth-name").required = registrationMode;
  document.getElementById("auth-swish").required = registrationMode;
  updateAuthLabels();
  document.getElementById("auth-password").autocomplete = registrationMode ? "new-password" : "current-password";
  document.getElementById("auth-reset").hidden = registrationMode;
  document.getElementById("auth-error").hidden = true;
  document.getElementById("auth-success").hidden = true;
});

document.getElementById("auth-reset").addEventListener("click", async () => {
  const email = document.getElementById("auth-email").value.trim();
  const button = document.getElementById("auth-reset");
  document.getElementById("auth-error").hidden = true;
  document.getElementById("auth-success").hidden = true;
  if (!email) {
    showError("auth-error", new Error(t("enterEmail")));
    document.getElementById("auth-email").focus();
    return;
  }
  try {
    button.disabled = true;
    button.textContent = t("sending");
    await authApi.sendPasswordResetEmail(auth, email);
    const success = document.getElementById("auth-success");
    success.textContent = t("resetSent");
    success.hidden = false;
  } catch (error) {
    showError("auth-error", error);
  } finally {
    button.disabled = false;
    button.textContent = t("forgotPassword");
  }
});

document.getElementById("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  document.getElementById("auth-error").hidden = true;
  document.getElementById("auth-success").hidden = true;
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  try {
    if (registrationMode) {
      const credential = profileCompletionMode
        ? { user: signedInUser }
        : await authApi.createUserWithEmailAndPassword(auth, email, password);
      const profile = {
        name: document.getElementById("auth-name").value.trim(),
        swish: normalizeSwish(document.getElementById("auth-swish").value),
        color: defaultProfileColor(credential.user.uid),
        avatarMode: "letter",
        avatarEmoji: "",
        email,
        createdAt: fs.serverTimestamp(),
      };
      await fs.setDoc(fs.doc(db, "users", credential.user.uid), profile);
      userProfile = profile;
      profileCompletionMode = false;
      await refreshBankbookMenu(false);
    } else {
      await authApi.signInWithEmailAndPassword(auth, email, password);
    }
  } catch (error) {
    showError("auth-error", error);
  }
});

async function joinBankbook(code) {
  const reference = fs.doc(db, "bankbooks", code);
  try {
    const existing = await loadBankbooks();
    if (existing.length && existing[0].id !== code) throw new Error("Kontot är redan kopplat till en annan delning.");
    await fs.runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error("Inbjudningskoden finns inte.");
      const bankbook = snapshot.data();
      if (bankbook.memberIds.includes(signedInUser.uid)) return;
      if (bankbook.memberIds.length >= 2) throw new Error("Den här delningen har redan två personer.");
      transaction.update(reference, {
        memberIds: [...bankbook.memberIds, signedInUser.uid],
        members: {
          ...bankbook.members,
          [signedInUser.uid]: {
            name: userProfile.name,
            swish: userProfile.swish,
            color: userProfile.color || defaultProfileColor(signedInUser.uid),
            avatarMode: userProfile.avatarMode || "letter",
            avatarEmoji: userProfile.avatarEmoji || "",
            slot: "B",
          },
        },
      });
    });
    document.getElementById("invite-code").value = "";
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("invite");
    window.history.replaceState({}, "", cleanUrl);
    await refreshBankbookMenu();
  } catch (error) {
    showOnly("bankbook-screen");
    showError("bankbook-error", error);
  }
}

document.getElementById("join-bankbook-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await joinBankbook(parseInvite(document.getElementById("invite-code").value));
});

document.getElementById("copy-invite").addEventListener("click", async () => {
  await navigator.clipboard.writeText(document.getElementById("invite-link").value);
  document.getElementById("copy-invite").textContent = t("copied");
});

document.getElementById("share-invite").addEventListener("click", async () => {
  const url = document.getElementById("invite-link").value;
  if (navigator.share) await navigator.share({ title: "Split Happens", text: t("shareInvite"), url });
  else await navigator.clipboard.writeText(url);
});

function closeSettings() {
  document.getElementById("settings-modal").hidden = true;
  document.getElementById("avatar-modal").hidden = true;
  document.getElementById("settings-error").hidden = true;
}

function showSettingsFromAvatar() {
  document.getElementById("avatar-modal").hidden = true;
  document.getElementById("settings-modal").hidden = false;
  updateAvatarSettings();
  document.getElementById("settings-avatar-trigger").focus();
}

function cancelAvatarSelection() {
  if (AVATAR_MODAL_ORIGINAL) {
    SETTINGS_COLOR = AVATAR_MODAL_ORIGINAL.color;
    SETTINGS_AVATAR_MODE = AVATAR_MODAL_ORIGINAL.mode;
    SETTINGS_AVATAR_EMOJI = AVATAR_MODAL_ORIGINAL.emoji;
  }
  AVATAR_MODAL_ORIGINAL = null;
  updateColorPicker();
  showSettingsFromAvatar();
}

document.getElementById("settings-trigger").addEventListener("click", () => {
  document.getElementById("settings-name").value = userProfile.name;
  SETTINGS_COLOR = validProfileColor(userProfile.color) ? userProfile.color : personColor(CURRENT_USER);
  SETTINGS_AVATAR_MODE = userProfile.avatarMode === "emoji" ? "emoji" : "letter";
  SETTINGS_AVATAR_EMOJI = firstGrapheme(userProfile.avatarEmoji || "");
  updateColorPicker();
  document.getElementById("settings-error").hidden = true;
  document.getElementById("settings-modal").hidden = false;
});

document.getElementById("settings-name").addEventListener("input", updateAvatarSettings);
document.getElementById("settings-avatar-trigger").addEventListener("click", () => {
  AVATAR_MODAL_ORIGINAL = {
    color: SETTINGS_COLOR,
    mode: SETTINGS_AVATAR_MODE,
    emoji: SETTINGS_AVATAR_EMOJI,
  };
  document.getElementById("settings-modal").hidden = true;
  document.getElementById("avatar-modal").hidden = false;
  updateColorPicker();
});
document.getElementById("avatar-cancel").addEventListener("click", cancelAvatarSelection);
document.getElementById("avatar-confirm").addEventListener("click", () => {
  AVATAR_MODAL_ORIGINAL = null;
  showSettingsFromAvatar();
});
document.getElementById("avatar-modal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) cancelAvatarSelection();
});
document.getElementById("settings-avatar-mode").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-avatar-mode]");
  if (!button) return;
  SETTINGS_AVATAR_MODE = button.dataset.avatarMode;
  updateAvatarSettings();
  if (SETTINGS_AVATAR_MODE === "emoji") document.getElementById("settings-avatar-emoji").focus();
});
document.getElementById("settings-avatar-emoji").addEventListener("input", (event) => {
  SETTINGS_AVATAR_EMOJI = firstGrapheme(event.target.value);
  updateAvatarSettings();
});
document.getElementById("settings-emoji-grid").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-emoji]");
  if (!button) return;
  SETTINGS_AVATAR_EMOJI = button.dataset.emoji;
  updateAvatarSettings();
});

document.getElementById("settings-color").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-color]");
  if (!button) return;
  SETTINGS_COLOR = button.dataset.color;
  updateColorPicker();
});

document.getElementById("settings-language").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-language]");
  if (!button || button.dataset.language === LANGUAGE) return;
  LANGUAGE = button.dataset.language;
  localStorage.setItem("split-happens-language", LANGUAGE);
  applyLanguage();
});
document.getElementById("settings-theme").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-theme]");
  if (!button || button.dataset.theme === THEME) return;
  THEME = button.dataset.theme;
  localStorage.setItem("split-happens-theme", THEME);
  applyTheme();
});

document.getElementById("settings-close").addEventListener("click", closeSettings);
document.getElementById("settings-modal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeSettings();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !document.getElementById("avatar-modal").hidden) {
    cancelAvatarSelection();
    return;
  }
  if (event.key === "Escape" && !document.getElementById("settings-modal").hidden) closeSettings();
});
document.getElementById("settings-logout").addEventListener("click", () => authApi.signOut(auth));
document.getElementById("settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("settings-name").value.trim();
  if (!name || !activeBankbook) return;
  try {
    const avatarMode = SETTINGS_AVATAR_MODE === "emoji" && SETTINGS_AVATAR_EMOJI ? "emoji" : "letter";
    const avatarEmoji = avatarMode === "emoji" ? firstGrapheme(SETTINGS_AVATAR_EMOJI) : "";
    const members = {
      ...activeBankbook.members,
      [signedInUser.uid]: {
        ...activeBankbook.members[signedInUser.uid],
        name,
        color: SETTINGS_COLOR,
        avatarMode,
        avatarEmoji,
      },
    };
    const batch = fs.writeBatch(db);
    batch.update(fs.doc(db, "users", signedInUser.uid), {
      name,
      color: SETTINGS_COLOR,
      avatarMode,
      avatarEmoji,
    });
    batch.update(fs.doc(db, "bankbooks", activeBankbook.id), { members });
    await batch.commit();
    userProfile = { ...userProfile, name, color: SETTINGS_COLOR, avatarMode, avatarEmoji };
    activeBankbook = { ...activeBankbook, members };
    PEOPLE[CURRENT_USER] = {
      ...PEOPLE[CURRENT_USER],
      name,
      color: SETTINGS_COLOR,
      avatarMode,
      avatarEmoji,
    };
    updatePersonLabels();
    updatePreview();
    render();
    closeSettings();
  } catch (error) {
    showError("settings-error", error);
  }
});

document.getElementById("logout-menu").addEventListener("click", () => authApi.signOut(auth));

async function initializeFirebase() {
  const appApi = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  fs = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  authApi = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  firebaseApp = appApi.initializeApp(FIREBASE_CONFIG, "bankboken-v2");
  db = fs.getFirestore(firebaseApp);
  auth = authApi.getAuth(firebaseApp);
  authApi.onAuthStateChanged(auth, async (user) => {
    signedInUser = user;
    if (!user) {
      if (unsubscribeEntries) unsubscribeEntries();
      if (unsubscribeWaitingRoom) unsubscribeWaitingRoom();
      if (unsubscribeActiveBankbook) unsubscribeActiveBankbook();
      unsubscribeWaitingRoom = null;
      unsubscribeActiveBankbook = null;
      closeSettings();
      profileCompletionMode = false;
      document.getElementById("auth-email").disabled = false;
      document.getElementById("auth-password").hidden = false;
      document.getElementById("auth-password").required = true;
      showOnly("auth-screen");
      return;
    }
    try {
      userProfile = await loadProfile(user.uid);
    } catch (error) {
      showOnly("auth-screen");
      showError("auth-error", error);
      return;
    }
    if (!userProfile) {
      profileCompletionMode = true;
      registrationMode = true;
      showOnly("auth-screen");
      document.getElementById("auth-name").hidden = false;
      document.getElementById("auth-swish").hidden = false;
      document.getElementById("auth-name").required = true;
      document.getElementById("auth-swish").required = true;
      document.getElementById("auth-email").value = user.email || "";
      document.getElementById("auth-email").disabled = true;
      document.getElementById("auth-password").hidden = true;
      document.getElementById("auth-password").required = false;
      updateAuthLabels();
      document.getElementById("auth-reset").hidden = true;
      showError("auth-error", new Error("Kontot är skapat, men profilen saknas. Publicera Firestore-reglerna och slutför sedan kontot här."));
      return;
    }
    await refreshBankbookMenu();
  });
}

applyLanguage();
initializeFirebase().catch((error) => showError("auth-error", error));
