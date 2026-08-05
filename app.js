import { FIREBASE_CONFIG } from "./config.js";

let PEOPLE = {
  A: { name: "Person 1", swish: "" },
  B: { name: "Person 2", swish: "" },
};
const MAX_MEMBERS = 10;
const MEMBER_SLOTS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const DEMO_MEMBERS = [
  ["demo-flygarn", { name: "Flygarn", color: "#5c8de8", avatarMode: "letter", avatarEmoji: "", slot: "B", demo: true }],
  ["demo-leo", { name: "Leo", color: "#f28c45", avatarMode: "letter", avatarEmoji: "", slot: "C", demo: true }],
  ["demo-danne", { name: "Danne", color: "#e6c84f", avatarMode: "letter", avatarEmoji: "", slot: "D", demo: true }],
  ["demo-pontus", { name: "Pontus", color: "#62b86b", avatarMode: "letter", avatarEmoji: "", slot: "E", demo: true }],
  ["demo-malin", { name: "Malin", color: "#38b6a5", avatarMode: "letter", avatarEmoji: "", slot: "F", demo: true }],
  ["demo-annie", { name: "Annie", color: "#4baed4", avatarMode: "letter", avatarEmoji: "", slot: "G", demo: true }],
  ["demo-susana", { name: "Susana", color: "#9a6dd7", avatarMode: "letter", avatarEmoji: "", slot: "H", demo: true }],
  ["demo-pau", { name: "Pau", color: "#df6da9", avatarMode: "letter", avatarEmoji: "", slot: "I", demo: true }],
  ["demo-carro", { name: "Carro", color: "#ef5b5b", avatarMode: "letter", avatarEmoji: "", slot: "J", demo: true }],
];
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
let entrySubscriptionToken = 0;
let openingBankbook = false;
let MULTI_EXPENSE_MODE = false;
let MULTI_SPLIT_MODE = "equal";
let PENDING_GROUP_SETTLEMENT = null;
let SHOW_ALL_GROUP_DEBTS = false;

const TRANSLATIONS = {
  sv: {
    authIntro: "Logga in för att komma åt er delning.", authRegisterIntro: "Skapa ett konto för att komma igång.", yourName: "Ditt namn", swishNumber: "Swishnummer",
    email: "E-post", password: "Lösenord, minst 6 tecken", login: "Logga in", loggingIn: "Loggar in…", createAccount: "Skapa ett konto", creating: "Skapar konto…",
    forgotPassword: "Glömt lösenord?", inviteOther: "Bjud in fler personer", chooseGroup: "Välj grupp", createGroup: "+ Skapa ny grupp",
    newGroupTitle: "Skapa ny grupp", groupName: "Gruppnamn", groupNameOptional: "Gruppnamn (valfritt)", groupSize: "Gruppstorlek", pairSize: "Par (2 pers)", multiSize: "Grupp (3–10 pers)", profileName: "Profilnamn", saveGroup: "Spara",
    pairParticipants: "Vem delar du med?", groupParticipants: "Lägg till deltagare", pairParticipantsHelp: "Personen väljer sitt namn när hen ansluter.", groupParticipantsHelp: "De väljer sitt namn när de ansluter.", partnerName: "Namn", participantName: "Person {number}", addParticipant: "+ Lägg till person",
    participants: "Deltagare", yourProfile: "Din profil", editProfile: "Ändra", done: "Klar", createGroupAction: "Skapa grupp", requiredGroupName: "Skriv ett namn på gruppen.", requiredParticipantNames: "Fyll i namn på alla deltagare.", requiredProfileName: "Fyll i ditt profilnamn.",
    whoAreYou: "Vem är du?", chooseYourProfile: "Välj din profil för att ansluta till gruppen.", waitingToJoin: "Väntar", uniqueParticipantNames: "Alla deltagare behöver ha unika namn.",
    groupCreated: "Gruppen är skapad. Bjud in fler med länken:", continueToGroup: "Fortsätt till gruppen",
    showAll: "Visa alla", hideAll: "Dölj alla",
    groupSection: "Grupp", profileSection: "Profil", owner: "Ägare", copyInviteLink: "Kopiera inbjudningslänk",
    deleteGroup: "Ta bort grupp", deleteGroupConfirm: "Ta bort gruppen ”{name}” och all data i den? Detta går inte att ångra.",
    groupMemberSingular: "medlem", groupMemberPlural: "medlemmar", groupPickerEmpty: "Du har inga grupper ännu. Skapa en ny eller anslut med en inbjudningslänk.",
    inviteHelp: "Samma länk kan användas tills gruppen har tio medlemmar.",
    copyLink: "Kopiera länk", copied: "Kopierad!", share: "Dela", gotInvite: "Har du fått en inbjudan?",
    pasteInvite: "Klistra in länk eller kod", join: "Anslut", logout: "Logga ut", settings: "Inställningar",
    closeSettings: "Stäng inställningar", balance: "Saldo", markPaid: "Markera som swishat", add: "Lägg till",
    expense: "Utgift", income: "Inkomst", description: "Beskrivning", descriptionExample: "t.ex. Matvaror ICA",
    amount: "Belopp", date: "Datum", split: "Delning", custom: "Anpassad", history: "Historik",
    statistics: "Statistik", closeStatistics: "Stäng statistik", timePeriod: "Tidsperiod", thisMonth: "Denna månad", thisYear: "I år", lifetime: "Totalt", customPeriod: "Anpassad",
    fromDate: "Från", toDate: "Till", totalExpenses: "Totala utgifter", expensesPerPerson: "Utlagt per person", expensesByCategory: "Utgifter per kategori",
    subscriptions: "Prenumerationer", subscriptionShare: "{percentage}% av utgifterna",
    statisticsCount: "{count} utgifter", statisticsCountOne: "1 utgift", statisticsNote: "Swish och inkomster ingår inte i utgiftssummorna.", noStatistics: "Inga utgifter under perioden.", otherCategory: "Övrigt",
    searchHistory: "Sök", noSearchResults: "Inga utgifter matchar sökningen.",
    language: "Språk", theme: "Tema", profileColor: "Avatarfärg", avatar: "Avatar", customizeAvatar: "Anpassa avatar", chooseAvatar: "Välj en avatar", choose: "Välj", cancel: "Avbryt", initial: "Initial", emoji: "Emoji", optionalEmoji: "Valfri emoji", chooseEmoji: "Välj emoji", customEmoji: "Annan emoji…", systemTheme: "Auto", lightTheme: "Ljust", darkTheme: "Mörkt", saveChanges: "Spara ändringar", you: "Du", youObject: "dig", payerYou: "Dig", receivedBy: "Mottaget av",
    paidBy: "Betalat av", addIncome: "Lägg till inkomst", addExpense: "Lägg till utgift",
    splitEqually: "Dela lika", personSingular: "person", personPlural: "personer",
    equalSharePreview: "Beloppet delas lika mellan {count} {people}.", selectParticipant: "Välj minst en person som ska vara med på utgiften.",
    balanceSettled: "Ditt saldo är jämnt.", anotherMember: "en annan medlem", suggestedSettlements: "Du har {count} föreslagna Swishar.", swishAction: "Swisha",
    demoMissingSwish: "Demoprofilen saknar Swishnummer.",
    editIncome: "Redigera inkomst", editExpense: "Redigera utgift", save: "Spara ändringar",
    allEven: "Allt är jämnt. Ingen är skyldig något.", oweSelf: "är skyldig", owesOther: "är skyldig", total: "Totalt",
    noEntries: "Inga utgifter än. Lägg till er första ovan.", noEntriesFor: "Inga utgifter för {name}.",
    page: "Sida {page} av {count}", settlement: "Swish", settlementSearchTerms: "Swish betalning överföring", paid: "betalade", received: "tog emot",
    treated: "bjöd 💕", delete: "Ta bort", deleteEntry: "Ta bort denna post?",
    entitledAll: "{name} har rätt till hela inkomsten.", entitled: "{name} har rätt till {amount}.",
    noDebtFull: "Ingen skuld – {name} står för hela beloppet.", becomesOwed: "{name} blir skyldig {recipient} {amount}.",
    welcomeWaiting: "Hej {name}! Konfigurera er grupp.", groupMembers: "Medlemmar", groupMemberCount: "{count} av {max} platser använda", groupReadyHelp: "Nio demoprofiler visas lokalt och sparas inte.", groupFull: "Gruppen är full.", demoMember: "Demo", continueToApp: "Fortsätt till appen", createAccountShort: "Skapa konto",
    alreadyAccount: "Jag har redan ett konto", sending: "Skickar…",
    resetSent: "Ett återställningsmail har skickats. Kontrollera även skräpposten.",
    enterEmail: "Fyll i din e-postadress först.", shareInvite: "Anslut till vår delning",
    completeAccount: "Slutför konto", switchAccount: "Logga ut och byt konto", synced: "Synkad (Firebase)",
    syncFailed: "Synkningen misslyckades", syncing: "Ansluter…", incomeIcon: "Inkomst", otherIcon: "Övrigt",
    inviteLink: "Inbjudningslänk", settleSwish: "Reglera med Swish", payWith: "Betala med", chooseCategory: "Välj kategori",
    currencySuffix: "kr", cancelEditing: "Avbryt redigering", deleteExpense: "Ta bort utlägg",
    historyPages: "Historiksidor", previousPage: "Föregående sida", nextPage: "Nästa sida",
    groceries: "Matvaror", restaurantCafe: "Restaurang & café", accommodation: "Boende",
    beauty: "Skönhet", transport: "Transport", travelExperiences: "Resor/upplevelser",
    entertainment: "Nöjen", alcohol: "Alkohol", interior: "Inredning", clothing: "Kläder",
    hobby: "Hobby/prylar", fika: "Fika", fitness: "Träning", gifts: "Presenter", streaming: "Media/streaming",
    receipt: "Kvitto", addReceipt: "Lägg till bild", changeReceipt: "Byt bild", removeReceipt: "Ta bort",
    receiptPreview: "Förhandsvisning av kvitto", receiptTooLarge: "Bilden är för stor. Välj en bild under 15 MB.",
    receiptInvalid: "Bilden kunde inte läsas. Prova en annan bild.", receiptUploadFailed: "Kvittot kunde inte laddas upp. Försök igen.",
    openReceipt: "Öppna kvittot i full storlek", closeReceipt: "Stäng kvitto", receiptFullSize: "Kvitto i full storlek", receiptZoomHint: "Nyp för att zooma · dra för att flytta",
    receiptReadingAmount: "Läser av beloppet…", receiptAmountFound: "Förslag: {amount} har fyllts i.",
    receiptAmountMissing: "Kunde inte hitta ett tydligt totalbelopp.", receiptAmountFailed: "Beloppet kunde inte läsas av.",
    receiptItems: "Fördela kvittot", receiptItemsHelp: "Välj vilka som ska vara med och stå för kostnaden på varje rad.",
    addReceiptItem: "+ Lägg till rad", receiptItemName: "Produkt", receiptUnknownItem: "Oidentifierad produktrad", receiptItemTotal: "Aktuella rader: {amount}",
    receiptItemBelowScanned: "{amount} mindre än avläst kvittototal",
    receiptItemAboveScanned: "{amount} mer än avläst kvittototal",
    receiptItemExact: "Samma som avläst kvittototal",
    removeReceiptItems: "Ta bort kvittodelningen",
    recurringMonthly: "Återkommande varje månad", recurringMonthlyHelp: "Skapas automatiskt samma dag varje månad.",
    recurringPayments: "Stående betalningar", noRecurringPayments: "Inga stående betalningar.", recurringDay: "dag {day} varje månad",
    stopRecurring: "Avsluta", stopRecurringConfirm: "Avsluta den stående betalningen? Redan skapade utgifter behålls.",
    missingGroupProfiles: "Gruppen saknar den profilinformation som krävs för att öppnas.", inviteNotFound: "Inbjudningskoden finns inte.",
    pairFull: "Den här gruppen har redan två personer.", groupAtCapacity: "Den här gruppen har redan tio personer.",
    profileAlreadyClaimed: "Den profilen har redan valts av någon annan. Öppna inbjudningslänken igen och välj en annan.", noGroupSpot: "Det finns ingen ledig plats i gruppen.",
    missingAccountProfile: "Kontot är skapat, men profilen saknas. Publicera Firestore-reglerna och slutför sedan kontot här.",
  },
  en: {
    authIntro: "Log in to access your shared expenses.", authRegisterIntro: "Create an account to get started.", yourName: "Your name", swishNumber: "Swish number",
    email: "Email", password: "Password, at least 6 characters", login: "Log in", loggingIn: "Logging in…", createAccount: "Create an account", creating: "Creating account…",
    forgotPassword: "Forgot password?", inviteOther: "Invite more people", chooseGroup: "Choose group", createGroup: "+ Create new group",
    newGroupTitle: "Create new group", groupName: "Group name", groupNameOptional: "Group name (optional)", groupSize: "Group size", pairSize: "Couple (2 people)", multiSize: "Group (3–10 people)", profileName: "Profile name", saveGroup: "Save",
    pairParticipants: "Who are you sharing with?", groupParticipants: "Add participants", pairParticipantsHelp: "They choose their name when joining.", groupParticipantsHelp: "They choose their name when joining.", partnerName: "Name", participantName: "Person {number}", addParticipant: "+ Add person",
    participants: "Participants", yourProfile: "Your profile", editProfile: "Edit", done: "Done", createGroupAction: "Create group", requiredGroupName: "Enter a name for the group.", requiredParticipantNames: "Enter a name for every participant.", requiredProfileName: "Enter your profile name.",
    whoAreYou: "Who are you?", chooseYourProfile: "Choose your profile to join the group.", waitingToJoin: "Pending", uniqueParticipantNames: "Each participant needs a unique name.",
    groupCreated: "Your group is ready. Invite others with this link:", continueToGroup: "Continue to group",
    showAll: "Show all", hideAll: "Hide all",
    groupSection: "Group", profileSection: "Profile", owner: "Owner", copyInviteLink: "Copy invitation link",
    deleteGroup: "Delete group", deleteGroupConfirm: "Delete “{name}” and all its data? This cannot be undone.",
    groupMemberSingular: "member", groupMemberPlural: "members", groupPickerEmpty: "You do not have any groups yet. Create a new one or join with an invitation link.",
    inviteHelp: "The same link can be used until the group has ten members.",
    copyLink: "Copy link", copied: "Copied!", share: "Share", gotInvite: "Have you received an invitation?",
    pasteInvite: "Paste link or code", join: "Join", logout: "Log out", settings: "Settings",
    closeSettings: "Close settings", balance: "Balance", markPaid: "Mark as paid", add: "Add",
    expense: "Expense", income: "Income", description: "Description", descriptionExample: "e.g. Groceries",
    amount: "Amount", date: "Date", split: "Split", custom: "Custom", history: "History",
    statistics: "Statistics", closeStatistics: "Close statistics", timePeriod: "Time period", thisMonth: "This month", thisYear: "This year", lifetime: "Lifetime", customPeriod: "Custom",
    fromDate: "From", toDate: "To", totalExpenses: "Total expenses", expensesPerPerson: "Paid per person", expensesByCategory: "Expenses by category",
    subscriptions: "Subscriptions", subscriptionShare: "{percentage}% of expenses",
    statisticsCount: "{count} expenses", statisticsCountOne: "1 expense", statisticsNote: "Swish payments and income are excluded from expense totals.", noStatistics: "No expenses in this period.", otherCategory: "Other",
    searchHistory: "Search", noSearchResults: "No expenses match your search.",
    language: "Language", theme: "Theme", profileColor: "Avatar color", avatar: "Avatar", customizeAvatar: "Customize avatar", chooseAvatar: "Choose an avatar", choose: "Choose", cancel: "Cancel", initial: "Initial", emoji: "Emoji", optionalEmoji: "Optional emoji", chooseEmoji: "Choose emoji", customEmoji: "Other emoji…", systemTheme: "Auto", lightTheme: "Light", darkTheme: "Dark", saveChanges: "Save changes", you: "You", youObject: "you", payerYou: "You", receivedBy: "Received by",
    paidBy: "Paid by", addIncome: "Add income", addExpense: "Add expense",
    splitEqually: "Split equally", personSingular: "person", personPlural: "people",
    equalSharePreview: "The amount is split equally between {count} {people}.", selectParticipant: "Choose at least one person to include in the expense.",
    balanceSettled: "Your balance is settled.", anotherMember: "another member", suggestedSettlements: "You have {count} suggested settlements.", swishAction: "Swish",
    demoMissingSwish: "This demo profile has no Swish number.",
    editIncome: "Edit income", editExpense: "Edit expense", save: "Save changes",
    allEven: "Everything is settled. No one owes anything.", oweSelf: "owe", owesOther: "owes", total: "Total",
    noEntries: "No expenses yet. Add your first one above.", noEntriesFor: "No expenses for {name}.",
    page: "Page {page} of {count}", settlement: "Swish", settlementSearchTerms: "Swish payment settlement transfer", paid: "paid", received: "received",
    treated: "treated {recipient} 💕", delete: "Delete", deleteEntry: "Delete this entry?",
    entitledAll: "{name} is entitled to all of the income.", entitled: "{name} is entitled to {amount}.",
    noDebtFull: "No debt – {name} covers the full amount.", becomesOwed: "{name} owes {recipient} {amount}.",
    welcomeWaiting: "Hi {name}! Set up your group.", groupMembers: "Members", groupMemberCount: "{count} of {max} spots used", groupReadyHelp: "Nine demo profiles are shown locally and are not saved.", groupFull: "The group is full.", demoMember: "Demo", continueToApp: "Continue to app", createAccountShort: "Create account",
    alreadyAccount: "I already have an account", sending: "Sending…",
    resetSent: "A password reset email has been sent. Please also check your spam folder.",
    enterEmail: "Enter your email address first.", shareInvite: "Join our shared expenses",
    completeAccount: "Complete account", switchAccount: "Log out and switch account", synced: "Synced (Firebase)",
    syncFailed: "Sync failed", syncing: "Connecting…", incomeIcon: "Income", otherIcon: "Other",
    inviteLink: "Invitation link", settleSwish: "Settle with Swish", payWith: "Settle with", chooseCategory: "Choose category",
    currencySuffix: "SEK", cancelEditing: "Cancel editing", deleteExpense: "Delete expense",
    historyPages: "History pages", previousPage: "Previous page", nextPage: "Next page",
    groceries: "Groceries", restaurantCafe: "Restaurant & café", accommodation: "Accommodation",
    beauty: "Beauty", transport: "Transport", travelExperiences: "Travel & experiences",
    entertainment: "Entertainment", alcohol: "Alcohol", interior: "Home decor", clothing: "Clothing",
    hobby: "Hobbies & gadgets", fika: "Coffee & cake", fitness: "Fitness", gifts: "Gifts", streaming: "Media & streaming",
    receipt: "Receipt", addReceipt: "Add image", changeReceipt: "Change image", removeReceipt: "Remove",
    receiptPreview: "Receipt preview", receiptTooLarge: "The image is too large. Choose an image under 15 MB.",
    receiptInvalid: "The image could not be read. Try another image.", receiptUploadFailed: "The receipt could not be uploaded. Please try again.",
    openReceipt: "Open receipt full size", closeReceipt: "Close receipt", receiptFullSize: "Receipt in full size", receiptZoomHint: "Pinch to zoom · drag to move",
    receiptReadingAmount: "Reading the amount…", receiptAmountFound: "Suggestion: {amount} has been filled in.",
    receiptAmountMissing: "Could not find a clear total amount.", receiptAmountFailed: "The amount could not be read.",
    receiptItems: "Split receipt", receiptItemsHelp: "Choose who should share the cost of each item.",
    addReceiptItem: "+ Add row", receiptItemName: "Item", receiptUnknownItem: "Unidentified receipt item", receiptItemTotal: "Current items: {amount}",
    receiptItemBelowScanned: "{amount} below scanned receipt total",
    receiptItemAboveScanned: "{amount} above scanned receipt total",
    receiptItemExact: "Same as scanned receipt total",
    removeReceiptItems: "Remove receipt split",
    recurringMonthly: "Recurring every month", recurringMonthlyHelp: "Created automatically on the same day each month.",
    recurringPayments: "Recurring payments", noRecurringPayments: "No recurring payments.", recurringDay: "day {day} every month",
    stopRecurring: "Stop", stopRecurringConfirm: "Stop this recurring payment? Expenses already created will be kept.",
    missingGroupProfiles: "The group does not have the profile information required to open it.", inviteNotFound: "The invitation code does not exist.",
    pairFull: "This couple already has two people.", groupAtCapacity: "This group already has ten people.",
    profileAlreadyClaimed: "Someone else has already chosen that profile. Open the invitation link again and choose another one.", noGroupSpot: "There are no available spots in the group.",
    missingAccountProfile: "The account was created, but its profile is missing. Publish the Firestore rules, then complete the account here.",
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
const PROFILE_COLORS = [
  "#ef5b5b",
  "#f28c45",
  "#e6c84f",
  "#9fbe55",
  "#62b86b",
  "#38b6a5",
  "#4baed4",
  "#5c8de8",
  "#9a6dd7",
  "#df6da9",
];
let SETTINGS_COLOR = PROFILE_COLORS[0];
let SETTINGS_AVATAR_MODE = "letter";
let SETTINGS_AVATAR_EMOJI = "";
let AVATAR_MODAL_ORIGINAL = null;
let AVATAR_TARGET = "settings";
let CREATED_BANKBOOK = null;
let CLAIM_MEMBER_RESOLVE = null;

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

function profileForEntry(entry) {
  const profiles = activeGroupProfiles();
  return profiles.find(([uid]) => uid === entry.payerUid)
    || profiles.find(([, profile]) => profile.slot === entry.payer)
    || null;
}

function historyEntryAvatar(entry) {
  const match = profileForEntry(entry);
  if (!match) return historyAvatar(entry.payer);
  const [, profile] = match;
  const avatar = profileAvatar(profile, profile.name) || "?";
  const emojiClass = profile.avatarMode === "emoji" ? " avatar-emoji" : "";
  const color = validProfileColor(profile.color) ? profile.color : defaultProfileColor(match[0]);
  return `<i class="history-person-avatar${emojiClass}" style="--profile-color:${color}">${escapeHtml(avatar)}</i>`;
}

function historyProfileAvatar(uid) {
  return historyEntryAvatar({ payerUid: uid, payer: activeGroupProfiles().find(([profileUid]) => profileUid === uid)?.[1]?.slot });
}

function updateAvatarSettings() {
  const creatingGroup = AVATAR_TARGET === "create";
  const name = document.getElementById(creatingGroup ? "create-group-profile-name" : "settings-name").value.trim();
  const emojiInput = document.getElementById("settings-avatar-emoji");
  const avatar = SETTINGS_AVATAR_MODE === "emoji" && SETTINGS_AVATAR_EMOJI
    ? firstGrapheme(SETTINGS_AVATAR_EMOJI)
    : firstGrapheme(name).toLocaleUpperCase(locale()) || "?";
  const trigger = document.getElementById(creatingGroup ? "create-group-avatar-trigger" : "settings-avatar-trigger");
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
  updateCreateGroupCopy();
  applyTheme();
  updateAuthLabels();
  if (APP_INITIALIZED) {
    updatePersonLabels();
    onEntryTypeChange(getEntryType());
    render();
    if (activeBankbook && !document.getElementById("settings-modal").hidden) renderGroupMembers(activeBankbook);
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
    subscribe(cb, onError) {
      const q = fs.query(col, fs.orderBy("ts", "desc"));
      return fs.onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error(err);
          setSync(false, t("syncFailed"));
          onError?.(err);
        });
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
  const sharedAmount = e.type === "expense"
    ? Math.max(0, e.amount - (Number(e.excludedAmount) || 0))
    : e.amount;
  if (e.split === "a") return { a: sharedAmount, b: 0 };        // Helo bears all
  if (e.split === "b") return { a: 0, b: sharedAmount };        // Halvis bears all
  if (e.split === "custom") {
    const shareA = Math.min(1, Math.max(0, Number(e.shareA) || 0));
    return { a: sharedAmount * shareA, b: sharedAmount * (1 - shareA) };
  }
  return { a: sharedAmount / 2, b: sharedAmount / 2 };              // 50/50
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

function entryPayerUid(entry, profiles = activeGroupProfiles()) {
  return entry.payerUid || profiles.find(([, profile]) => profile.slot === entry.payer)?.[0] || "";
}

function groupExperienceType(bankbook = activeBankbook) {
  if (["pair", "group"].includes(bankbook?.groupType)) return bankbook.groupType;
  if (bankbook?.demoMode === true || bankbook?.multiGroup === true) return "group";
  return "pair";
}

function currentMemberId(bankbook = activeBankbook) {
  if (!signedInUser || !bankbook?.members) return signedInUser?.uid || "";
  if (bankbook.members[signedInUser.uid]) return signedInUser.uid;
  return Object.entries(bankbook.members).find(([, profile]) => profile.claimedBy === signedInUser.uid)?.[0]
    || signedInUser.uid;
}

function pendingGroupProfiles(bankbook) {
  return Object.entries(bankbook?.members || {})
    .filter(([, profile]) => profile.pending === true && !profile.claimedBy)
    .sort(([, left], [, right]) => MEMBER_SLOTS.indexOf(left.slot) - MEMBER_SLOTS.indexOf(right.slot));
}

function isPairExperience(bankbook = activeBankbook) {
  return groupExperienceType(bankbook) === "pair";
}

function usesGroupExperience(bankbook = activeBankbook) {
  return !isPairExperience(bankbook);
}

function profileUidForSlot(slot, profiles = activeGroupProfiles()) {
  return profiles.find(([, profile]) => profile.slot === slot)?.[0] || "";
}

function applyExperienceMode(bankbook = activeBankbook) {
  const mode = isPairExperience(bankbook) ? "pair" : "group";
  document.documentElement.dataset.experience = mode;
  return mode;
}

function groupBalancesForCurrent(entries) {
  const profiles = activeGroupProfiles();
  const profileUids = profiles.map(([uid]) => uid);
  const ownMemberId = currentMemberId();
  const balances = new Map(profileUids.filter((uid) => uid !== ownMemberId).map((uid) => [uid, 0]));

  for (const entry of entries) {
    const payerUid = entryPayerUid(entry, profiles);
    if (!payerUid) continue;

    if (entry.type === "settlement" && entry.payerUid && entry.recipientUid) {
      const amount = Number(entry.amount) || 0;
      if (entry.payerUid === ownMemberId) balances.set(entry.recipientUid, (balances.get(entry.recipientUid) || 0) + amount);
      if (entry.recipientUid === ownMemberId) balances.set(entry.payerUid, (balances.get(entry.payerUid) || 0) - amount);
      continue;
    }

    const participants = entry.participantUids?.length ? entry.participantUids : profileUids;
    if (!participants.length || !participants.includes(ownMemberId)) continue;
    const sharedAmount = entry.type === "expense"
      ? Math.max(0, Number(entry.amount) - (Number(entry.excludedAmount) || 0))
      : Number(entry.amount) || 0;
    const share = sharedAmount / participants.length;
    const direction = entry.type === "income" ? -1 : 1;

    if (payerUid === ownMemberId) {
      participants.filter((uid) => uid !== ownMemberId).forEach((uid) => {
        balances.set(uid, (balances.get(uid) || 0) + share * direction);
      });
    } else {
      balances.set(payerUid, (balances.get(payerUid) || 0) - share * direction);
    }
  }

  return [...balances.entries()]
    .map(([uid, amount]) => ({ uid, amount: Math.round(amount * 100) / 100 }))
    .filter(({ amount }) => Math.abs(amount) >= 0.01);
}

function groupNetBalances(entries) {
  const profiles = activeGroupProfiles();
  const profileUids = profiles.map(([uid]) => uid);
  const balances = new Map(profileUids.map((uid) => [uid, 0]));

  for (const entry of entries) {
    const payerUid = entryPayerUid(entry, profiles);
    if (!payerUid || !balances.has(payerUid)) continue;
    const amount = Number(entry.amount) || 0;

    if (entry.type === "settlement") {
      const settlementPayerUid = entry.payerUid || profileUidForSlot(entry.payer, profiles);
      const settlementRecipientUid = entry.recipientUid || profileUidForSlot(entry.payer === "A" ? "B" : "A", profiles);
      if (!settlementPayerUid || !settlementRecipientUid || !balances.has(settlementPayerUid) || !balances.has(settlementRecipientUid)) continue;
      const amountCents = Math.round(amount * 100);
      balances.set(settlementPayerUid, (balances.get(settlementPayerUid) || 0) + amountCents);
      balances.set(settlementRecipientUid, (balances.get(settlementRecipientUid) || 0) - amountCents);
      continue;
    }

    const participants = (entry.participantUids?.length ? entry.participantUids : [])
      .filter((uid) => balances.has(uid));
    if (!entry.participantUids?.length) {
      const legacyShares = sharesOf(entry);
      const slotShares = [
        [profileUidForSlot("A", profiles), legacyShares.a],
        [profileUidForSlot("B", profiles), legacyShares.b],
      ].filter(([uid, share]) => uid && balances.has(uid) && share > 0);
      if (!slotShares.length) continue;
      const sharedAmount = slotShares.reduce((sum, [, share]) => sum + share, 0);
      const sharedCents = Math.round(sharedAmount * 100);
      const direction = entry.type === "income" ? -1 : 1;
      balances.set(payerUid, (balances.get(payerUid) || 0) + sharedCents * direction);
      let assignedCents = 0;
      slotShares.forEach(([uid, share], index) => {
        const shareCents = index === slotShares.length - 1
          ? sharedCents - assignedCents
          : Math.round(share * 100);
        assignedCents += shareCents;
        balances.set(uid, (balances.get(uid) || 0) - shareCents * direction);
      });
      continue;
    }
    if (!participants.length) continue;
    const sharedAmount = entry.type === "expense"
      ? Math.max(0, amount - (Number(entry.excludedAmount) || 0))
      : amount;
    const sharedCents = Math.round(sharedAmount * 100);
    const baseShareCents = Math.floor(sharedCents / participants.length);
    let remainderCents = sharedCents - (baseShareCents * participants.length);
    const direction = entry.type === "income" ? -1 : 1;
    balances.set(payerUid, (balances.get(payerUid) || 0) + sharedCents * direction);
    participants.forEach((uid) => {
      const shareCents = baseShareCents + (remainderCents > 0 ? 1 : 0);
      remainderCents = Math.max(0, remainderCents - 1);
      balances.set(uid, (balances.get(uid) || 0) - shareCents * direction);
    });
  }

  return [...balances.entries()]
    .map(([uid, cents]) => ({ uid, cents }))
    .filter(({ cents }) => cents !== 0);
}

function optimizedSwishPlan(entries) {
  const balances = groupNetBalances(entries);
  if (!balances.length) return [];
  let best = null;

  function search(values, transactions) {
    if (best && transactions.length >= best.length) return;
    const firstIndex = values.findIndex(({ cents }) => cents !== 0);
    if (firstIndex === -1) {
      best = transactions.slice();
      return;
    }

    const first = values[firstIndex];
    const triedAmounts = new Set();
    for (let index = firstIndex + 1; index < values.length; index += 1) {
      const other = values[index];
      if (!other.cents || Math.sign(other.cents) === Math.sign(first.cents) || triedAmounts.has(other.cents)) continue;
      triedAmounts.add(other.cents);
      const amount = Math.min(Math.abs(first.cents), Math.abs(other.cents));
      const debtor = first.cents < 0 ? first.uid : other.uid;
      const creditor = first.cents > 0 ? first.uid : other.uid;
      const originalFirst = first.cents;
      const originalOther = other.cents;
      first.cents += first.cents < 0 ? amount : -amount;
      other.cents += other.cents < 0 ? amount : -amount;
      transactions.push({ fromUid: debtor, toUid: creditor, amount: amount / 100 });
      search(values, transactions);
      transactions.pop();
      first.cents = originalFirst;
      other.cents = originalOther;
    }
  }

  search(balances.map((balance) => ({ ...balance })), []);
  return best || [];
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
let RECURRING_TEMPLATES = [];
let GENERATING_RECURRING = false;
let CURRENT_USER = localStorage.getItem("bankboken-person");
let APP_INITIALIZED = false;
let HISTORY_FILTER = null;
let HISTORY_SEARCH = "";
let HISTORY_PAGE = 1;
let OPEN_SWIPE_ROW = null;
let GROUP_DATA_LOADING = false;
let STATISTICS_PERIOD = "month";
const HISTORY_PAGE_SIZE = 10;

const STATISTICS_CATEGORY_KEYS = {
  "🛒": "groceries",
  "🍽️": "restaurantCafe",
  "🏠": "accommodation",
  "💄": "beauty",
  "🚕": "transport",
  "✈️": "travelExperiences",
  "🎟️": "entertainment",
  "🍺": "alcohol",
  "🛋️": "interior",
  "🛍️": "clothing",
  "🎮": "hobby",
  "☕": "fika",
  "🏋️": "fitness",
  "🎁": "gifts",
  "📺": "streaming",
  "🧾": "otherCategory",
};

const STATISTICS_CATEGORY_ALIASES = {
  "📷": "🎮",
  "🍰": "☕",
  "🧼": "💄",
  "🏟️": "🎟️",
  "🎬": "🎟️",
  "🍿": "🎟️",
  "🎉": "🎟️",
  "🎢": "🎟️",
  "🍷": "🍺",
  "🚗": "🚕",
  "⛽": "🚕",
  "🗺️": "✈️",
};

function inputDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function statisticsRange() {
  const now = new Date();
  if (STATISTICS_PERIOD === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
  }
  if (STATISTICS_PERIOD === "year") {
    return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
  }
  if (STATISTICS_PERIOD === "custom") {
    const fromValue = document.getElementById("statistics-from").value;
    const toValue = document.getElementById("statistics-to").value;
    const start = fromValue ? new Date(`${fromValue}T00:00:00`) : null;
    const end = toValue ? new Date(`${toValue}T00:00:00`) : null;
    if (end) end.setDate(end.getDate() + 1);
    return { start, end };
  }
  return { start: null, end: null };
}

function statisticsPeriodLabel(range) {
  if (STATISTICS_PERIOD === "month") {
    return new Date().toLocaleDateString(locale(), { month: "long", year: "numeric" });
  }
  if (STATISTICS_PERIOD === "year") return String(new Date().getFullYear());
  if (STATISTICS_PERIOD === "lifetime") return t("lifetime");
  const options = { day: "numeric", month: "short", year: "numeric" };
  const from = range.start?.toLocaleDateString(locale(), options);
  const inclusiveEnd = range.end ? new Date(range.end.getTime() - 1) : null;
  const to = inclusiveEnd?.toLocaleDateString(locale(), options);
  if (from && to) return `${from} – ${to}`;
  return from || to || t("customPeriod");
}

function renderStatistics() {
  const modal = document.getElementById("statistics-modal");
  if (!modal || modal.hidden || !activeBankbook) return;
  const profiles = displayGroupProfiles();
  const range = statisticsRange();
  const expenses = ENTRIES.filter((entry) => {
    if (entry.type !== "expense") return false;
    const timestamp = entry.ts?.toMillis?.() ?? Number(entry.ts);
    if (!Number.isFinite(timestamp)) return false;
    if (range.start && timestamp < range.start.getTime()) return false;
    if (range.end && timestamp >= range.end.getTime()) return false;
    return true;
  });
  const total = expenses.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const recurringTotal = expenses
    .filter((entry) => Boolean(entry.recurringId))
    .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
  const recurringPercentage = total > 0 ? Math.round((recurringTotal / total) * 100) : 0;
  const personStatistics = profiles.map(([uid, profile], index) => {
    const amount = expenses
      .filter((entry) => entryPayerUid(entry, profiles) === uid)
      .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    return {
      amount,
      color: validProfileColor(profile.color) ? profile.color : PROFILE_COLORS[index % PROFILE_COLORS.length],
      name: uid === currentMemberId() ? t("you") : profile.name,
    };
  });

  document.querySelectorAll("#statistics-period [data-statistics-period]").forEach((button) =>
    button.classList.toggle("active", button.dataset.statisticsPeriod === STATISTICS_PERIOD));
  document.getElementById("statistics-custom-range").hidden = STATISTICS_PERIOD !== "custom";
  document.getElementById("statistics-period-label").textContent = statisticsPeriodLabel(range);
  document.getElementById("statistics-total").textContent = kr(total);
  document.getElementById("statistics-count").textContent = expenses.length === 1
    ? t("statisticsCountOne")
    : t("statisticsCount", { count: expenses.length });
  document.getElementById("statistics-recurring-total").textContent = kr(recurringTotal);
  document.getElementById("statistics-recurring-share").textContent = t("subscriptionShare", { percentage: recurringPercentage });

  let piePosition = 0;
  const pieSegments = personStatistics
    .filter(({ amount }) => amount > 0 && total > 0)
    .map(({ amount, color }) => {
      const start = piePosition;
      piePosition += (amount / total) * 100;
      return `${color} ${start}% ${piePosition}%`;
    });
  const pieBackground = pieSegments.length
    ? `conic-gradient(${pieSegments.join(",")})`
    : "var(--field)";
  const pieLabel = personStatistics
    .filter(({ amount }) => amount > 0)
    .map(({ name, amount }) => `${name}: ${kr(amount)}`)
    .join(", ");
  document.getElementById("statistics-people").innerHTML = `<div class="statistics-people-chart">
    <div class="statistics-pie" role="img" aria-label="${escapeHtml(pieLabel || t("noStatistics"))}" style="--statistics-pie:${pieBackground}"></div>
    <div class="statistics-pie-legend">${personStatistics.map(({ amount, color, name }) => {
      const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
      return `<div class="statistics-pie-legend-row">
        <span><i class="profile-dot" style="--profile-color:${color}"></i>${escapeHtml(name)}</span>
        <strong>${kr(amount)} <small>${percentage}%</small></strong>
      </div>`;
    }).join("")}</div>
  </div>`;

  const categories = new Map();
  expenses.forEach((entry) => {
    const sourceIcon = entry.icon || "🧾";
    const icon = STATISTICS_CATEGORY_ALIASES[sourceIcon]
      || (STATISTICS_CATEGORY_KEYS[sourceIcon] ? sourceIcon : "🧾");
    categories.set(icon, (categories.get(icon) || 0) + (Number(entry.amount) || 0));
  });
  const sortedCategories = [...categories.entries()].sort((left, right) => right[1] - left[1]);
  document.getElementById("statistics-categories").innerHTML = sortedCategories.map(([icon, amount]) => {
    const width = total > 0 ? (amount / total) * 100 : 0;
    const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
    return `<div class="statistics-row statistics-category-row">
      <div class="statistics-row-head"><span><i class="statistics-category-icon">${icon}</i>${escapeHtml(t(STATISTICS_CATEGORY_KEYS[icon]))}</span><strong>${kr(amount)} <small>${percentage}%</small></strong></div>
      <span class="statistics-bar"><i style="width:${width}%"></i></span>
    </div>`;
  }).join("");

  const empty = expenses.length === 0;
  document.getElementById("statistics-empty").hidden = !empty;
  document.querySelectorAll("#statistics-modal .statistics-section").forEach((section) => { section.hidden = empty; });
}

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
  if (entry.participantUids?.length) {
    const count = entry.participantUids.length;
    const label = t("splitEqually");
    const peopleLabel = t(count === 1 ? "personSingular" : "personPlural");
    return `${label} · ${count} ${peopleLabel}`;
  }
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

function renderLoadingState() {
  document.getElementById("saldo-card").setAttribute("aria-busy", "true");
  document.getElementById("history-list").setAttribute("aria-busy", "true");
  const heading = document.getElementById("balance-heading");
  heading.classList.remove("is-positive");
  heading.innerHTML = '<span class="skeleton-block skeleton-balance"></span>';
  document.getElementById("balance-sub").innerHTML = '<span class="skeleton-block skeleton-copy"></span>';
  document.getElementById("balance-show-all").hidden = true;
  document.getElementById("swish-suggestions").hidden = true;
  document.getElementById("swish-suggestions").replaceChildren();
  document.getElementById("settle-btn").hidden = true;
  document.getElementById("settle-panel").hidden = true;

  const totals = document.getElementById("totals");
  totals.hidden = false;
  totals.classList.remove("is-filtered");
  totals.innerHTML = Array.from({ length: 3 }, () => `
    <span class="history-total-skeleton">
      <span class="skeleton-block skeleton-total-label"></span>
      <span class="skeleton-block skeleton-total-value"></span>
    </span>`).join("");

  document.getElementById("history-list").innerHTML = Array.from({ length: 3 }, () => `
    <li class="history-skeleton-row" aria-hidden="true">
      <span class="skeleton-block skeleton-history-icon"></span>
      <span class="history-skeleton-main">
        <span class="skeleton-block skeleton-history-title"></span>
        <span class="skeleton-block skeleton-history-sub"></span>
      </span>
      <span class="skeleton-block skeleton-history-amount"></span>
    </li>`).join("");
  document.getElementById("history-empty").hidden = true;
  document.getElementById("history-pagination").hidden = true;
}

function render() {
  if (GROUP_DATA_LOADING) {
    renderLoadingState();
    return;
  }
  document.getElementById("saldo-card").removeAttribute("aria-busy");
  document.getElementById("history-list").removeAttribute("aria-busy");
  renderBalance();
  renderHistory();
  renderRecurringSettings();
  renderStatistics();
}

function renderRecurringSettings() {
  const section = document.getElementById("recurring-settings");
  const list = document.getElementById("recurring-settings-list");
  const empty = document.getElementById("recurring-settings-empty");
  if (!section || !list || !empty) return;
  section.hidden = !isPairExperience();
  list.replaceChildren();
  empty.hidden = RECURRING_TEMPLATES.length > 0;
  RECURRING_TEMPLATES.forEach((template) => {
    const item = document.createElement("div");
    item.className = "recurring-settings-item";
    const day = template.dayOfMonth || Number(template.startDate?.split("-")[2]) || 1;
    item.innerHTML = `<span><strong>${escapeHtml(template.desc)}</strong><small>${kr(template.amount)} · ${escapeHtml(t("recurringDay", { day }))}</small></span><button class="recurring-stop" type="button" data-recurring-stop="${template.id}">${escapeHtml(t("stopRecurring"))}</button>`;
    list.appendChild(item);
  });
}

function nextMonthlyOccurrence(dateValue, preferredDay) {
  const [year, month] = dateValue.split("-").map(Number);
  const nextMonth = new Date(year, month, 1);
  const day = Math.min(Number(preferredDay) || 1, new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate());
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

async function ensureRecurringEntries(templates, existingIds) {
  if (!isPairExperience() || GENERATING_RECURRING || !store) return;
  GENERATING_RECURRING = true;
  try {
    const today = todayInputValue();
    for (const template of templates) {
      const preferredDay = template.dayOfMonth || Number(template.startDate?.split("-")[2]) || 1;
      let occurrenceDate = template.generatedThrough ? nextMonthlyOccurrence(template.generatedThrough, preferredDay) : template.startDate;
      let latestDate = template.generatedThrough || "";
      let generated = 0;
      while (occurrenceDate && occurrenceDate <= today && generated < 120) {
        const occurrenceId = `recurring-${template.id}-${occurrenceDate}`;
        if (!existingIds.has(occurrenceId)) {
          await store.createIfMissing(occurrenceId, {
            type: "expense", desc: template.desc, amount: template.amount, icon: template.icon || ICON_DEFAULT,
            payer: template.payer, split: template.split || "even", shareA: template.shareA ?? null,
            excludedAmount: 0, ts: expenseTimestamp(occurrenceDate), recurringId: template.id, recurringOccurrence: occurrenceDate,
          });
          existingIds.add(occurrenceId);
        }
        latestDate = occurrenceDate;
        occurrenceDate = nextMonthlyOccurrence(occurrenceDate, preferredDay);
        generated += 1;
      }
      if (latestDate && latestDate !== template.generatedThrough) await store.update(template.id, { generatedThrough: latestDate });
    }
  } catch (error) { console.error(error); setSync(false, t("syncFailed")); }
  finally { GENERATING_RECURRING = false; }
}

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

function setBalanceHeading(heading, amount) {
  heading.textContent = kr(amount);
  heading.classList.toggle("is-positive", amount > 0.005);
}

function renderBalance() {
  if (usesGroupExperience()) {
    renderGroupBalance();
    return;
  }
  document.getElementById("balance-show-all").hidden = true;
  SHOW_ALL_GROUP_DEBTS = false;
  document.getElementById("swish-suggestions").hidden = true;
  const bal = balanceOf(ENTRIES);
  const heading = document.getElementById("balance-heading");
  const sub = document.getElementById("balance-sub");
  const btn = document.getElementById("settle-btn");
  const panel = document.getElementById("settle-panel");

  panel.hidden = true;
  btn.hidden = true;
  if (Math.abs(bal) < 0.01) {
    setBalanceHeading(heading, 0);
    sub.textContent = t("allEven");
    return;
  }

  const debtorKey = bal > 0 ? "B" : "A";
  const creditorKey = bal > 0 ? "A" : "B";
  const creditor = PEOPLE[creditorKey];
  const owed = Math.abs(bal);

  setBalanceHeading(heading, CURRENT_USER === debtorKey ? -owed : owed);
  const owesVerb = t(debtorKey === CURRENT_USER ? "oweSelf" : "owesOther");
  sub.innerHTML = `<strong>${escapeHtml(subjectName(debtorKey))}</strong> ${owesVerb} ${escapeHtml(objectName(creditorKey))}`;
  if (CURRENT_USER !== debtorKey) return;

  btn.hidden = false;
  btn.querySelector("span").textContent = `${t("swishAction")} ${objectName(creditorKey)} ${kr(owed)}`;
  btn.dataset.payee = creditor.swish;
  btn.dataset.amount = owed.toFixed(2);
}

function renderGroupBalance() {
  const heading = document.getElementById("balance-heading");
  const sub = document.getElementById("balance-sub");
  const btn = document.getElementById("settle-btn");
  const panel = document.getElementById("settle-panel");
  const profiles = activeGroupProfiles();
  const ownMemberId = currentMemberId();
  const plan = optimizedSwishPlan(ENTRIES);
  const ownTransactions = plan.filter((transaction) => transaction.fromUid === ownMemberId || transaction.toUid === ownMemberId);
  const showAllButton = document.getElementById("balance-show-all");
  const suggestions = document.getElementById("swish-suggestions");
  const hasAdditionalGroupTransactions = plan.some((transaction) => (
    transaction.fromUid !== ownMemberId && transaction.toUid !== ownMemberId
  ));

  if (!hasAdditionalGroupTransactions) SHOW_ALL_GROUP_DEBTS = false;
  showAllButton.hidden = !hasAdditionalGroupTransactions;
  showAllButton.setAttribute("aria-expanded", String(SHOW_ALL_GROUP_DEBTS));
  showAllButton.querySelector("span").textContent = t(SHOW_ALL_GROUP_DEBTS ? "hideAll" : "showAll");

  const renderRoutes = (defaultPlan = []) => {
    if (SHOW_ALL_GROUP_DEBTS && plan.length) {
      btn.hidden = true;
      const expandedPlan = [
        ...plan.filter((transaction) => transaction.fromUid !== ownMemberId),
        ...plan.filter((transaction) => transaction.fromUid === ownMemberId),
      ];
      renderSwishSuggestions(profiles, expandedPlan);
      return;
    }
    if (defaultPlan.length) {
      renderSwishSuggestions(profiles, defaultPlan);
      return;
    }
    suggestions.hidden = true;
    suggestions.replaceChildren();
  };

  panel.hidden = true;
  btn.hidden = true;
  btn.disabled = false;
  document.getElementById("swish-suggestions").hidden = true;
  if (!ownTransactions.length) {
    setBalanceHeading(heading, 0);
    sub.textContent = t("balanceSettled");
    renderRoutes();
    return;
  }

  if (ownTransactions.length > 1) {
    const net = ownTransactions.reduce((sum, transaction) => sum + (transaction.toUid === ownMemberId ? transaction.amount : -transaction.amount), 0);
    const outgoingTransactions = ownTransactions.filter((transaction) => transaction.fromUid === ownMemberId);
    setBalanceHeading(heading, net);
    if (outgoingTransactions.length === ownTransactions.length) {
      const recipientNames = outgoingTransactions.map((transaction) => (
        profiles.find(([profileUid]) => profileUid === transaction.toUid)?.[1]?.name
        || t("anotherMember")
      ));
      const recipients = new Intl.ListFormat(locale(), { style: "long", type: "conjunction" }).format(recipientNames);
      sub.innerHTML = `<strong>${escapeHtml(t("you"))}</strong> ${t("oweSelf")} ${escapeHtml(recipients)}`;
    } else {
      sub.textContent = t("suggestedSettlements", { count: ownTransactions.length });
    }
    renderRoutes(ownTransactions);
    return;
  }

  const [transaction] = ownTransactions;
  const currentUserOwes = transaction.fromUid === ownMemberId;
  const otherUid = currentUserOwes ? transaction.toUid : transaction.fromUid;
  const profile = profiles.find(([profileUid]) => profileUid === otherUid)?.[1];
  const name = profile?.name || t("anotherMember");
  setBalanceHeading(heading, currentUserOwes ? -transaction.amount : transaction.amount);
  sub.innerHTML = currentUserOwes
    ? `<strong>${escapeHtml(t("you"))}</strong> ${t("oweSelf")} ${escapeHtml(name)}`
    : `<strong>${escapeHtml(name)}</strong> ${t("owesOther")} ${escapeHtml(t("youObject"))}`;

  if (!currentUserOwes) {
    renderRoutes();
    return;
  }
  btn.hidden = false;
  btn.querySelector("span").textContent = `${t("swishAction")} ${name} ${kr(transaction.amount)}`;
  btn.dataset.payee = profile?.swish || "";
  btn.dataset.amount = transaction.amount.toFixed(2);
  btn.dataset.payeeUid = otherUid;
  renderRoutes();
}

function renderSwishSuggestions(profiles = activeGroupProfiles(), suggestedPlan = optimizedSwishPlan(ENTRIES)) {
  const container = document.getElementById("swish-suggestions");
  const plan = suggestedPlan;
  container.hidden = !plan.length;
  if (!plan.length) {
    container.replaceChildren();
    return;
  }

  const ownMemberId = currentMemberId();
  const nameFor = (uid) => uid === ownMemberId
    ? t("you")
    : (profiles.find(([profileUid]) => profileUid === uid)?.[1]?.name || "–");
  container.innerHTML = `
    <div class="swish-suggestion-list">
      ${plan.map((transaction) => {
        const recipient = profiles.find(([uid]) => uid === transaction.toUid)?.[1];
        const clickable = transaction.fromUid === ownMemberId;
        if (clickable) {
          const recipientName = nameFor(transaction.toUid);
          return `
          <button class="swish-suggestion swish-suggestion-action" type="button" data-payee="${escapeHtml(recipient?.swish || "")}" data-payee-uid="${escapeHtml(transaction.toUid)}" data-amount="${transaction.amount.toFixed(2)}">
            <span>${escapeHtml(t("swishAction"))} ${escapeHtml(recipientName)} ${kr(transaction.amount)}</span>
            <img class="swish-logo-img" src="swish-logo-secondary-dark-bg.svg" alt="Swish" />
          </button>`;
        }
        return `
        <div class="swish-suggestion swish-suggestion-incoming">
          <div class="swish-suggestion-route"><b>${escapeHtml(nameFor(transaction.fromUid))}</b><i>→</i><b>${escapeHtml(nameFor(transaction.toUid))}</b></div>
          <span class="swish-suggestion-amount">${kr(transaction.amount)}</span>
        </div>`;
      }).join("")}
    </div>`;
}

function renderHistory() {
  const list = document.getElementById("history-list");
  const empty = document.getElementById("history-empty");
  const totals = document.getElementById("totals");
  const pagination = document.getElementById("history-pagination");
  const profiles = displayGroupProfiles();
  list.innerHTML = "";

  const hasEntries = ENTRIES.length > 0;
  totals.hidden = !hasEntries;
  totals.classList.toggle("is-filtered", Boolean(HISTORY_FILTER));

  if (hasEntries) {
    const payerUidFor = (entry) => entry.payerUid || profiles.find(([, profile]) => profile.slot === entry.payer)?.[0] || "";
    const amountFor = (uid) => ENTRIES
      .filter((entry) => entry.type === "expense" && payerUidFor(entry) === uid)
      .reduce((sum, entry) => sum + entry.amount, 0);
    const memberTotals = profiles.map(([uid, profile], index) => ({
      uid,
      profile,
      amount: amountFor(uid),
      color: validProfileColor(profile.color) ? profile.color : PROFILE_COLORS[index % PROFILE_COLORS.length],
    }));
    const allAmount = memberTotals.reduce((sum, member) => sum + member.amount, 0);
    totals.innerHTML = `${memberTotals.map(({ uid, profile, amount, color }) => `
      <button type="button" data-filter="${escapeHtml(uid)}" class="${HISTORY_FILTER === uid ? "active" : ""}" aria-pressed="${HISTORY_FILTER === uid}"><span class="total-label"><i class="profile-dot" style="--profile-color:${color}"></i>${escapeHtml(uid === currentMemberId() ? t("you") : profile.name)}</span><b>${kr0(amount)}</b></button>`).join("")}
      <button type="button" data-filter="all">${t("total")}<b>${kr0(allAmount)}</b></button>`;
  }

  let visibleEntries = HISTORY_FILTER
    ? ENTRIES.filter((entry) => {
      const payerUid = entry.payerUid || profiles.find(([, profile]) => profile.slot === entry.payer)?.[0];
      return payerUid === HISTORY_FILTER;
    })
    : ENTRIES;
  const searchQuery = HISTORY_SEARCH.trim().toLocaleLowerCase(locale());
  if (searchQuery) {
    visibleEntries = visibleEntries.filter((entry) => {
      const payerUid = entry.payerUid || profiles.find(([, profile]) => profile.slot === entry.payer)?.[0];
      const payerName = profiles.find(([uid]) => uid === payerUid)?.[1]?.name || PEOPLE[entry.payer]?.name || "";
      const recipientUid = entry.type === "settlement"
        ? entry.recipientUid || profileUidForSlot(entry.payer === "A" ? "B" : "A", profiles)
        : "";
      const recipientName = profiles.find(([uid]) => uid === recipientUid)?.[1]?.name
        || (entry.type === "settlement" ? PEOPLE[otherPersonKey(entry.payer)]?.name || "" : "");
      const entryType = entry.type === "settlement"
        ? `${t("settlementSearchTerms")} ${t("paid")}`
        : entry.type === "income"
        ? t("income")
        : t("expense");
      const searchableText = `${entry.desc || ""} ${entryType} ${payerName} ${recipientName} ${entry.amount || ""} ${kr(entry.amount || 0)}`;
      return searchableText.toLocaleLowerCase(locale()).includes(searchQuery);
    });
  }
  empty.hidden = visibleEntries.length > 0;
  empty.textContent = searchQuery
    ? t("noSearchResults")
    : HISTORY_FILTER
    ? t("noEntriesFor", { name: profiles.find(([uid]) => uid === HISTORY_FILTER)?.[1]?.name || t("you") })
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
      const payerUid = entryPayerUid(e, profiles);
      const recipientUid = e.recipientUid || profileUidForSlot(e.payer === "A" ? "B" : "A", profiles);
      const payerName = profiles.find(([uid]) => uid === payerUid)?.[1]?.name || PEOPLE[e.payer]?.name || subjectName(e.payer);
      const recipientName = profiles.find(([uid]) => uid === recipientUid)?.[1]?.name || PEOPLE[e.payer === "A" ? "B" : "A"]?.name || "";
      const amountSign = payerUid === currentMemberId() ? "−" : recipientUid === currentMemberId() ? "+" : "";
      li.className = "h-settle";
      li.innerHTML = `
        <div class="h-ico"><img class="swish-history-mark" src="swish-mark.svg" alt="" /></div>
        <div class="h-main">
          <div class="h-title">${t("settlement")}</div>
          <div class="h-sub settlement-flow" aria-label="${escapeHtml(`${payerName} → ${recipientName}`)}">${historyProfileAvatar(payerUid)}<span aria-hidden="true">→</span>${historyProfileAvatar(recipientUid)}</div>
        </div>
        <div class="h-amt">${amountSign}${kr(e.amount)}</div>`;
    } else if (e.type === "income") {
      li.className = "h-income";
      li.innerHTML = `
        <div class="h-ico">${e.icon || "💰"}</div>
        <div class="h-main">
          <div class="h-title">${escapeHtml(e.desc)}</div>
          <div class="h-sub">${historyEntryAvatar(e)}<span>${splitLabel(e)}</span></div>
        </div>
        <div class="h-amt">+${kr(e.amount)}</div>`;
    } else {
      const shares = sharesOf(e);
      const payerShare = e.payer === "A" ? shares.a : shares.b;
      const historyCopy = e.participantUids?.length
        ? splitLabel(e)
        : Math.abs(payerShare - e.amount) < 0.01
        ? `${PEOPLE[e.payer]?.name || subjectName(e.payer)} ${t("treated", { recipient: objectName(otherPersonKey(e.payer)) })}`
        : splitLabel(e);
      li.innerHTML = `
        <div class="h-ico">${e.icon || "🧾"}</div>
        <div class="h-main">
          <div class="h-title">${escapeHtml(e.desc)}</div>
          <div class="h-sub">${historyEntryAvatar(e)}<span>${escapeHtml(historyCopy)}</span></div>
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
  if (!payee) {
    window.alert(t("demoMissingSwish"));
    return;
  }
  if (usesGroupExperience()) {
    PENDING_GROUP_SETTLEMENT = { toUid: btn.dataset.payeeUid, amount: Number(amount) };
  }
  const link = buildSwishLink(payee, amount, settlementMessage());

  document.getElementById("settle-panel").hidden = false;
  window.open(link, "_blank", "noopener,noreferrer");
}

async function confirmSettlement() {
  if (usesGroupExperience()) {
    const transaction = PENDING_GROUP_SETTLEMENT
      ? { fromUid: currentMemberId(), toUid: PENDING_GROUP_SETTLEMENT.toUid, amount: PENDING_GROUP_SETTLEMENT.amount }
      : optimizedSwishPlan(ENTRIES).find((item) => item.fromUid === currentMemberId());
    if (!transaction) return;
    const recipientUid = transaction.toUid;
    const payerProfile = activeGroupProfiles().find(([uid]) => uid === currentMemberId())?.[1];
    await store.add({
      type: "settlement",
      payer: payerProfile?.slot || CURRENT_USER,
      payerUid: currentMemberId(),
      recipientUid,
      amount: transaction.amount,
      ts: Date.now(),
    });
    document.getElementById("settle-panel").hidden = true;
    PENDING_GROUP_SETTLEMENT = null;
    document.getElementById("saldo-card").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
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
let receiptOcrRequest = 0;
let tesseractLoader = null;
let receiptItems = [];
let receiptGrossAmount = 0;
let receiptScannedTotal = 0;
const TESSERACT_SCRIPT = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/6.0.1/tesseract.min.js";

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

function selectedMultiParticipants() {
  return [...document.querySelectorAll('#multi-participants input[type="checkbox"]:checked')].map((input) => input.value);
}

function updateMultiParticipantAmounts() {
  const participantRows = [...document.querySelectorAll("#multi-participants .multi-participant")];
  if (!participantRows.length) return;

  const amount = parseFloat(document.getElementById("e-amount").value) || 0;
  const selectedCount = selectedMultiParticipants().length;
  const amountPerPerson = selectedCount > 0 ? amount / selectedCount : 0;

  participantRows.forEach((row) => {
    const input = row.querySelector('input[type="checkbox"]');
    const amountLabel = row.querySelector("[data-participant-amount]");
    if (amountLabel) amountLabel.textContent = kr(input?.checked ? amountPerPerson : 0);
  });
}

function setMultiSplitMode(mode) {
  MULTI_SPLIT_MODE = mode === "custom" ? "custom" : "equal";
  document.querySelectorAll("#e-multi-split-mode [data-multi-split]").forEach((button) => {
    button.classList.toggle("active", button.dataset.multiSplit === MULTI_SPLIT_MODE);
  });
  document.getElementById("multi-participants").hidden = MULTI_SPLIT_MODE !== "custom";
  updateEditingDirtyState();
}

function renderMultiExpenseControls(entry = null) {
  const profiles = displayGroupProfiles();
  const ownMemberId = currentMemberId();
  MULTI_EXPENSE_MODE = usesGroupExperience();
  document.getElementById("e-payer").hidden = MULTI_EXPENSE_MODE;
  document.getElementById("e-payer-multi-wrap").hidden = !MULTI_EXPENSE_MODE;
  document.getElementById("e-split").hidden = MULTI_EXPENSE_MODE;
  document.getElementById("custom-split").hidden = MULTI_EXPENSE_MODE || getSplit?.() !== "custom";
  document.getElementById("multi-split").hidden = !MULTI_EXPENSE_MODE;
  if (!MULTI_EXPENSE_MODE) return;

  const payerSelect = document.getElementById("e-payer-multi");
  payerSelect.innerHTML = profiles.map(([uid, profile]) => `<option value="${escapeHtml(uid)}">${escapeHtml(uid === ownMemberId ? t("payerYou") : profile.name)}</option>`).join("");
  payerSelect.value = entry?.payerUid && profiles.some(([uid]) => uid === entry.payerUid) ? entry.payerUid : ownMemberId;
  document.getElementById("e-payer-multi-value").textContent = profiles.find(([uid]) => uid === payerSelect.value)?.[0] === ownMemberId
    ? t("payerYou")
    : profiles.find(([uid]) => uid === payerSelect.value)?.[1]?.name || "";
  document.getElementById("e-payer-multi-menu").innerHTML = profiles.map(([uid, profile], index) => {
    const name = uid === ownMemberId ? t("payerYou") : profile.name;
    const color = validProfileColor(profile.color) ? profile.color : PROFILE_COLORS[index % PROFILE_COLORS.length];
    const avatar = profileAvatar(profile, profile.name) || "?";
    const emojiClass = profile.avatarMode === "emoji" ? " avatar-emoji" : "";
    return `<button type="button" role="option" data-payer-uid="${escapeHtml(uid)}" aria-selected="${uid === payerSelect.value}"><i class="multi-payer-menu-avatar${emojiClass}" style="--profile-color:${color}">${escapeHtml(avatar)}</i><span>${escapeHtml(name)}</span></button>`;
  }).join("");

  const savedParticipants = new Set(entry?.participantUids?.length ? entry.participantUids : profiles.map(([uid]) => uid));
  document.getElementById("multi-participants").innerHTML = profiles.map(([uid, profile], index) => {
    const name = uid === ownMemberId ? t("you") : profile.name;
    const color = validProfileColor(profile.color) ? profile.color : PROFILE_COLORS[index % PROFILE_COLORS.length];
    return `<label class="multi-participant" style="--profile-color:${color}"><input type="checkbox" value="${escapeHtml(uid)}" ${savedParticipants.has(uid) ? "checked" : ""}><span class="multi-participant-name">${escapeHtml(name)}</span><span class="multi-participant-amount" data-participant-amount></span></label>`;
  }).join("");
  setMultiSplitMode(entry?.multiSplitMode || "equal");
  updateMultiParticipantAmounts();
}

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
  renderMultiExpenseControls();
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
  const recurringField = document.getElementById("recurring-field");
  recurringField.hidden = !isPairExperience() || isIncome || Boolean(EDITING_ID);
  if (recurringField.hidden) document.getElementById("e-recurring").checked = false;
  document.getElementById("expense-heading").textContent = EDITING_ID
    ? t(isIncome ? "editIncome" : "editExpense")
    : t("add");
  document.getElementById("edit-modal-title").textContent = t(isIncome ? "editIncome" : "editExpense");
  document.getElementById("date-label").textContent = t("date");
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
    payerUid: MULTI_EXPENSE_MODE ? document.getElementById("e-payer-multi").value : "",
    multiSplitMode: MULTI_EXPENSE_MODE ? MULTI_SPLIT_MODE : "",
    participantUids: MULTI_EXPENSE_MODE ? selectedMultiParticipants().sort() : [],
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

function showReceiptOcrStatus(message = "", state = "") {
  const status = document.getElementById("receipt-ocr-status");
  status.textContent = message;
  status.dataset.state = state;
  status.hidden = !message;
}

function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractLoader) return tesseractLoader;
  tesseractLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TESSERACT_SCRIPT;
    script.crossOrigin = "anonymous";
    script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("ocr-unavailable"));
    script.onerror = () => reject(new Error("ocr-unavailable"));
    document.head.appendChild(script);
  }).catch((error) => {
    tesseractLoader = null;
    throw error;
  });
  return tesseractLoader;
}

function parseReceiptAmount(value) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/(\d)[.,](?=\d{3}(?:\D|$))/g, "$1")
    .replace(",", ".");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) && amount > 0 && amount < 1000000 ? amount : null;
}

function normalizeReceiptOcrText(text) {
  return String(text || "").replace(
    /(\d)[,.]\s*([0-9oO]{1,2})(?=\D|$)/g,
    (_, whole, decimals) => `${whole},${decimals.replace(/[oO]/g, "0").padEnd(2, "0")}`,
  );
}

function cleanReceiptItemName(value) {
  return value
    .replace(/^\s*\d+\s*(?:[x×]\s*)?/i, "")
    .replace(/^[^A-Za-zÅÄÖåäö0-9]+|[\s.:;-]+$/g, "")
    .trim();
}

function receiptDateValue(year, month, day) {
  const date = new Date(year, month - 1, day);
  if (
    year < 2000 ||
    year > 2100 ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function guessReceiptDate(text) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const dateLabel = /\b(datum|date|köpdatum|transaction\s*date)\b/i;
  const yearFirst = /\b(20\d{2})\s*[-/. ]\s*(\d{1,2})\s*[-/. ]\s*(\d{1,2})\b/;
  const dayFirst = /\b(\d{1,2})\s*[-/. ]\s*(\d{1,2})\s*[-/. ]\s*(20\d{2})\b/;
  const candidates = [];

  lines.forEach((line, lineIndex) => {
    const context = [line, lines[lineIndex + 1] || ""].join(" ");
    const labelled = dateLabel.test(line);
    const yearMatch = context.match(yearFirst);
    const dayMatch = context.match(dayFirst);
    if (yearMatch) {
      const value = receiptDateValue(Number(yearMatch[1]), Number(yearMatch[2]), Number(yearMatch[3]));
      if (value) candidates.push({ value, score: labelled ? 10 : 1, lineIndex });
    }
    if (dayMatch) {
      const value = receiptDateValue(Number(dayMatch[3]), Number(dayMatch[2]), Number(dayMatch[1]));
      if (value) candidates.push({ value, score: labelled ? 10 : 1, lineIndex });
    }
  });

  candidates.sort((first, second) => second.score - first.score || first.lineIndex - second.lineIndex);
  return candidates[0]?.value || null;
}

function guessReceiptAmount(text) {
  const lines = normalizeReceiptOcrText(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const positiveWords = /\b(att\s*betala|totalt?|summa|slutsumma|belopp|amount\s*due|grand\s*total|total)\b/i;
  const negativeWords = /\b(moms|varav|vat|rabatt|discount|växel|change|delsumma|subtotal|avrundning|rounding)\b/i;
  const amountPattern = /(?:\d{1,3}(?:[ .]\d{3})+|\d+)[,.]\d{2}(?!\d)|(?:\d{1,3}(?:[ .]\d{3})+|\d+)\s*(?:kr|sek)\b/gi;
  const candidates = [];
  const positiveLines = lines
    .map((line, index) => positiveWords.test(line) && !negativeWords.test(line) ? index : -1)
    .filter((index) => index >= 0);
  const negativeLines = lines
    .map((line, index) => negativeWords.test(line) ? index : -1)
    .filter((index) => index >= 0);

  lines.forEach((line, lineIndex) => {
    const matches = [...line.matchAll(amountPattern)];
    matches.forEach((match) => {
      const amount = parseReceiptAmount(match[0].replace(/\s*(?:kr|sek)\b/i, ""));
      if (amount === null) return;
      let score = (lineIndex / Math.max(1, lines.length - 1)) * 3;
      const positiveDistance = positiveLines.reduce(
        (closest, index) => lineIndex >= index ? Math.min(closest, lineIndex - index) : closest,
        Number.POSITIVE_INFINITY,
      );
      const negativeDistance = negativeLines.reduce(
        (closest, index) => lineIndex >= index ? Math.min(closest, lineIndex - index) : closest,
        Number.POSITIVE_INFINITY,
      );
      if (positiveWords.test(line) && !negativeWords.test(line)) score += 18;
      else if (positiveDistance === 1) score += 14;
      else if (positiveDistance === 2) score += 5;
      if (negativeWords.test(line)) score -= 24;
      else if (negativeDistance === 1) score -= 16;
      else if (negativeDistance === 2) score -= 6;
      if (/\b(kr|sek)\b/i.test(line)) score += 1;
      candidates.push({ amount, score, lineIndex });
    });
  });

  if (!candidates.length) return null;
  const largestAmount = Math.max(...candidates.map((candidate) => candidate.amount));
  candidates.forEach((candidate) => {
    if (candidate.amount === largestAmount) candidate.score += 2;
  });
  candidates.sort((first, second) =>
    second.score - first.score || second.lineIndex - first.lineIndex || second.amount - first.amount);
  return candidates[0].amount;
}

function extractReceiptItems(text, receiptTotal) {
  const excluded = /\b(total|totalt|summa|att\s*betala|subtotal|delsumma|moms|vat|varav|rabatt|discount|växel|change|avrundning|rounding|kort|card|swish|kontant|cash|org\.?nr|datum|date|tid|time)\b/i;
  const amountAtEnd = /(?:^|\s)((?:\d{1,3}(?:[ .]\d{3})+|\d+)[,.]\d{2})\s*(?:kr|sek)?(?:\s*[^0-9]{0,4})$/i;
  const quantityOnly = /^\d+(?:[,.]\d+)?\s*(?:st(?:yck)?\.?\s*)?[x×]\s*(?:\d+[,.]\d{2})?$/i;
  const amountOnly = /^((?:\d{1,3}(?:[ .]\d{3})+|\d+)[,.]\d{2})\s*(?:kr|sek)?$/i;
  const quantityProduct = /^\d+(?:[,.]\d+)?\s*(?:st(?:yck)?\.?\s*)?[x×]\s+.*[A-Za-zÅÄÖåäö]/i;
  const seen = new Set();
  const lines = normalizeReceiptOcrText(text).split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const items = lines.flatMap((line, lineIndex) => {
    const match = line.match(amountAtEnd);
    if (!match || excluded.test(line)) return [];
    const amount = parseReceiptAmount(match[1]);
    if (amount === null || amount === receiptTotal) return [];
    const inlineName = line.slice(0, match.index).replace(/^[^A-Za-zÅÄÖåäö0-9]+|[\s.:;-]+$/g, "").trim();
    const normalizedInlineName = inlineName
      .replace(/[—–−-]+/g, " ")
      .replace(/[^\dA-Za-zÅÄÖåäö.,x×\s]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^(\d+(?:[,.]\d+)?)\s*[x×]{1,2}$/i, "$1 x")
      .trim();
    const previousLine = lines[lineIndex - 1] || "";
    const isQuantityLine = quantityOnly.test(normalizedInlineName);
    if (isQuantityLine) return [];
    const name = cleanReceiptItemName(inlineName);
    if (name.length < 2 || !/[A-Za-zÅÄÖåäö]/.test(name)) return [];
    const key = `${name.toLowerCase()}-${amount}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ id: crypto.randomUUID(), name, amount, allocation: "even" }];
  });

  const totalLineIndex = lines.findIndex((line) => /\b(total|totalt|att\s*betala|grand\s*total)\b/i.test(line));
  const productArea = totalLineIndex >= 0 ? lines.slice(0, totalLineIndex + 1) : lines;
  const separatedNames = productArea
    .filter((line) => quantityProduct.test(line) && !amountAtEnd.test(line) && !excluded.test(line))
    .map(cleanReceiptItemName);
  const separatedAmounts = productArea.flatMap((line) => {
    const match = line.match(amountOnly);
    if (!match) return [];
    const amount = parseReceiptAmount(match[1]);
    return amount === null || amount === receiptTotal ? [] : [amount];
  });

  if (separatedNames.length && separatedNames.length === separatedAmounts.length) {
    separatedNames.forEach((name, index) => {
      const amount = separatedAmounts[index];
      const key = `${name.toLowerCase()}-${amount}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ id: crypto.randomUUID(), name, amount, allocation: "even" });
    });
  }

  const identifiedTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const unidentifiedAmount = receiptTotal - identifiedTotal;
  if (items.length && unidentifiedAmount > 0.01 && unidentifiedAmount < receiptTotal) {
    items.push({
      id: crypto.randomUUID(),
      name: t("receiptUnknownItem"),
      amount: unidentifiedAmount,
      allocation: "even",
    });
  }

  return items.slice(0, 30);
}

function receiptItemsShare() {
  const selfAmount = receiptItems.reduce((sum, item) => {
    if (item.allocation === "self") return sum + item.amount;
    if (item.allocation === "even") return sum + item.amount / 2;
    return sum;
  }, 0);
  const includedTotal = receiptItems.reduce(
    (sum, item) => item.allocation === "none" ? sum : sum + item.amount,
    0,
  );
  const receiptTotal = parseFloat(document.getElementById("e-amount").value) || includedTotal;
  const unassigned = Math.max(0, receiptTotal - includedTotal);
  return receiptTotal > 0 ? (selfAmount + unassigned / 2) / receiptTotal : 0.5;
}

function receiptItemsExcludedAmount() {
  return receiptItems.reduce((sum, item) => item.allocation === "none" ? sum + item.amount : sum, 0);
}

function applyReceiptItemsSplit() {
  if (!receiptItems.length) return;
  document.getElementById("e-custom-share").value = String(100 - Math.round(receiptItemsShare() * 100));
  setActive("e-split", "custom");
  onSplitChange("custom");
  updateCustomSplitLabels();
  updateEditingDirtyState();
}

function renderReceiptItems() {
  const panel = document.getElementById("receipt-items");
  const list = document.getElementById("receipt-items-list");
  panel.hidden = !receiptItems.length;
  list.replaceChildren();
  const selfName = subjectName(CURRENT_USER);
  const otherName = subjectName(otherPersonKey());

  receiptItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "receipt-item";
    row.dataset.id = item.id;
    row.innerHTML = `
      <div class="receipt-item-fields">
        <input class="receipt-item-name" value="${escapeHtml(item.name)}" aria-label="${t("receiptItemName")}" />
        <div class="receipt-item-amount-wrap">
          <input class="receipt-item-amount" type="number" inputmode="decimal" min="0" step="0.01" value="${item.amount.toFixed(2)}" aria-label="${t("amount")}" />
          <span>${t("currencySuffix")}</span>
        </div>
        <button class="receipt-item-remove" type="button" aria-label="${t("delete")}">×</button>
      </div>
      <div class="receipt-item-people" aria-label="${t("split")}">
        <button type="button" data-person="self" aria-pressed="false">${escapeHtml(selfName)}</button>
        <button type="button" data-person="other" aria-pressed="false">${escapeHtml(otherName)}</button>
      </div>`;
    row.classList.toggle("is-excluded", item.allocation === "none");
    const selectedPeople = item.allocation === "even"
      ? ["self", "other"]
      : (item.allocation === "none" ? [] : [item.allocation]);
    row.querySelectorAll("[data-person]").forEach((button) => {
      const active = selectedPeople.includes(button.dataset.person);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      const personKey = button.dataset.person === "self" ? CURRENT_USER : otherPersonKey();
      button.style.setProperty("--profile-color", personColor(personKey));
    });
    list.appendChild(row);
  });

  const excludedAmount = receiptItemsExcludedAmount();
  if (receiptGrossAmount > 0) {
    document.getElementById("e-amount").value = Math.max(0, receiptGrossAmount - excludedAmount).toFixed(2);
  }
  const itemTotal = receiptItems.reduce(
    (sum, item) => item.allocation === "none" ? sum : sum + item.amount,
    0,
  );
  const receiptTotal = parseFloat(document.getElementById("e-amount").value) || 0;
  const difference = receiptTotal - receiptScannedTotal;
  document.getElementById("receipt-items-total").textContent = t("receiptItemTotal", { amount: kr(itemTotal) });
  const differenceElement = document.getElementById("receipt-items-difference");
  differenceElement.textContent = Math.abs(difference) < 0.01
    ? t("receiptItemExact")
    : t(difference < 0 ? "receiptItemBelowScanned" : "receiptItemAboveScanned", { amount: kr(Math.abs(difference)) });
  differenceElement.classList.toggle("is-exact", Math.abs(difference) < 0.01);
  applyReceiptItemsSplit();
}

async function suggestAmountFromReceipt(imageData, requestId, initialAmount, initialDate) {
  showReceiptOcrStatus(t("receiptReadingAmount"), "loading");
  try {
    const Tesseract = await loadTesseract();
    const result = await Tesseract.recognize(imageData, "swe+eng", {
      preserve_interword_spaces: "1",
      tessedit_pageseg_mode: "6",
      user_defined_dpi: "300",
      logger: (progress) => {
        if (requestId !== receiptOcrRequest || progress.status !== "recognizing text") return;
        const percentage = Math.max(1, Math.round((progress.progress || 0) * 100));
        showReceiptOcrStatus(`${t("receiptReadingAmount")} ${percentage} %`, "loading");
      },
    });
    if (requestId !== receiptOcrRequest) return;
    const ocrText = result?.data?.text || "";
    const suggestion = guessReceiptAmount(ocrText);
    const suggestedDate = guessReceiptDate(ocrText);
    const dateInput = document.getElementById("e-date");
    if (suggestedDate && dateInput.value === initialDate) dateInput.value = suggestedDate;
    if (suggestion === null) {
      updateEditingDirtyState();
      showReceiptOcrStatus(t("receiptAmountMissing"), "muted");
      return;
    }
    const amountInput = document.getElementById("e-amount");
    receiptScannedTotal = suggestion;
    if (amountInput.value !== initialAmount && amountInput.value.trim() !== "") {
      receiptGrossAmount = Number(amountInput.value) || suggestion;
      receiptItems = extractReceiptItems(ocrText, suggestion);
      renderReceiptItems();
      showReceiptOcrStatus(t("receiptAmountFound", { amount: kr(suggestion) }), "muted");
      return;
    }
    receiptItems = extractReceiptItems(ocrText, suggestion);
    receiptGrossAmount = receiptItems.length
      ? receiptItems.reduce((sum, item) => sum + item.amount, 0)
      : suggestion;
    amountInput.value = receiptGrossAmount.toFixed(2);
    renderReceiptItems();
    updatePreview();
    updateEditingDirtyState();
    showReceiptOcrStatus(t("receiptAmountFound", { amount: kr(suggestion) }), "success");
  } catch (error) {
    if (requestId !== receiptOcrRequest) return;
    console.error(error);
    showReceiptOcrStatus(t("receiptAmountFailed"), "muted");
  }
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

function estimateReceiptRotation(image) {
  const sampleWidth = 260;
  const sampleScale = sampleWidth / image.width;
  const sample = document.createElement("canvas");
  sample.width = sampleWidth;
  sample.height = Math.max(1, Math.round(image.height * sampleScale));
  const context = sample.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, sample.width, sample.height);
  const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
  const isPaperPixel = (index) => {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
    return luminance > 135 && Math.max(red, green, blue) - Math.min(red, green, blue) < 55;
  };
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  for (let y = 0; y < sample.height; y += 1) {
    for (let x = 0; x < sample.width; x += 1) {
      const index = (y * sample.width + x) * 4;
      if (!isPaperPixel(index)) continue;
      count += 1;
      sumX += x;
      sumY += y;
    }
  }
  if (count < sample.width * sample.height * 0.03) return 0;
  const meanX = sumX / count;
  const meanY = sumY / count;
  let covarianceX = 0;
  let covarianceY = 0;
  let covarianceXY = 0;
  for (let y = 0; y < sample.height; y += 1) {
    for (let x = 0; x < sample.width; x += 1) {
      const index = (y * sample.width + x) * 4;
      if (!isPaperPixel(index)) continue;
      const offsetX = x - meanX;
      const offsetY = y - meanY;
      covarianceX += offsetX * offsetX;
      covarianceY += offsetY * offsetY;
      covarianceXY += offsetX * offsetY;
    }
  }
  const axisDegrees = 0.5 * Math.atan2(
    2 * covarianceXY,
    covarianceX - covarianceY,
  ) * 180 / Math.PI;
  const fromVertical = axisDegrees > 0 ? axisDegrees - 90 : axisDegrees + 90;
  const rotation = -fromVertical;
  return Math.abs(rotation) >= 2 && Math.abs(rotation) <= 22 ? rotation : 0;
}

async function prepareReceiptForOcr(file) {
  const image = await imageFromFile(file);
  const maxSide = 2200;
  const scale = Math.min(2, maxSide / Math.max(image.width, image.height));
  const sourceWidth = Math.max(1, Math.round(image.width * scale));
  const sourceHeight = Math.max(1, Math.round(image.height * scale));
  const rotation = estimateReceiptRotation(image);
  const radians = rotation * Math.PI / 180;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(
    Math.abs(sourceWidth * Math.cos(radians)) + Math.abs(sourceHeight * Math.sin(radians)),
  ));
  canvas.height = Math.max(1, Math.round(
    Math.abs(sourceWidth * Math.sin(radians)) + Math.abs(sourceHeight * Math.cos(radians)),
  ));
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(radians);
  context.drawImage(
    image,
    -sourceWidth / 2,
    -sourceHeight / 2,
    sourceWidth,
    sourceHeight,
  );
  image.close?.();
  return canvasDataUrl(canvas, 0.95);
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
  document.querySelector(".receipt-field").hidden = false;
  document.getElementById("e-recurring").checked = false;
  pendingReceiptData = "";
  removeExistingReceipt = false;
  receiptOcrRequest += 1;
  clearPendingReceiptUrl();
  renderReceiptPreview();
  showReceiptError();
  showReceiptOcrStatus();
  receiptItems = [];
  receiptGrossAmount = 0;
  receiptScannedTotal = 0;
  renderReceiptItems();
  renderMultiExpenseControls();
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
  renderMultiExpenseControls(entry);
  pendingReceiptData = "";
  removeExistingReceipt = false;
  receiptOcrRequest += 1;
  clearPendingReceiptUrl();
  renderReceiptPreview();
  showReceiptError();
  showReceiptOcrStatus();
  receiptItems = [];
  receiptGrossAmount = 0;
  receiptScannedTotal = 0;
  renderReceiptItems();
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
  updateMultiParticipantAmounts();
  const type = getEntryType();
  const split = getSplit(); // 'a' | 'even' | 'b'
  const payer = payerKey();
  const other = payer === "A" ? "B" : "A";
  const el = document.getElementById("split-preview");

  if (amount <= 0) { el.hidden = true; return; }
  if (MULTI_EXPENSE_MODE) {
    const participants = MULTI_SPLIT_MODE === "equal" ? activeGroupProfiles().length : selectedMultiParticipants().length;
    el.hidden = false;
    el.textContent = participants > 0
      ? t("equalSharePreview", { count: participants, people: t(participants === 1 ? "personSingular" : "personPlural") })
      : t("selectParticipant");
    return;
  }
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
  document.getElementById("e-multi-split-mode").addEventListener("click", (event) => {
    const button = event.target.closest("[data-multi-split]");
    if (!button) return;
    setMultiSplitMode(button.dataset.multiSplit);
    updatePreview();
  });
  document.getElementById("multi-participants").addEventListener("change", () => {
    updatePreview();
    updateEditingDirtyState();
  });
  document.getElementById("e-payer-multi").addEventListener("change", () => {
    updatePreview();
    updateEditingDirtyState();
  });
  document.getElementById("e-payer-multi-trigger").addEventListener("click", () => {
    const menu = document.getElementById("e-payer-multi-menu");
    const open = menu.hidden;
    menu.hidden = !open;
    document.getElementById("e-payer-multi-trigger").setAttribute("aria-expanded", String(open));
  });
  document.getElementById("e-payer-multi-menu").addEventListener("click", (event) => {
    const option = event.target.closest("button[data-payer-uid]");
    if (!option) return;
    const payerSelect = document.getElementById("e-payer-multi");
    payerSelect.value = option.dataset.payerUid;
    document.getElementById("e-payer-multi-value").textContent = option.querySelector("span").textContent;
    document.querySelectorAll("#e-payer-multi-menu [data-payer-uid]").forEach((button) =>
      button.setAttribute("aria-selected", String(button === option)));
    document.getElementById("e-payer-multi-menu").hidden = true;
    document.getElementById("e-payer-multi-trigger").setAttribute("aria-expanded", "false");
    payerSelect.dispatchEvent(new Event("change", { bubbles: true }));
  });
  document.addEventListener("click", (event) => {
    const wrapper = document.getElementById("e-payer-multi-wrap");
    if (wrapper.contains(event.target)) return;
    document.getElementById("e-payer-multi-menu").hidden = true;
    document.getElementById("e-payer-multi-trigger").setAttribute("aria-expanded", "false");
  });
  document.getElementById("e-payer-multi-trigger").addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.getElementById("e-payer-multi-menu").hidden = true;
    event.currentTarget.setAttribute("aria-expanded", "false");
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
    const requestId = ++receiptOcrRequest;
    const initialAmount = document.getElementById("e-amount").value;
    const initialDate = document.getElementById("e-date").value;
    showReceiptError();
    showReceiptOcrStatus();
    receiptItems = [];
    receiptGrossAmount = 0;
    receiptScannedTotal = 0;
    renderReceiptItems();
    try {
      const [imageData, ocrImageData] = await Promise.all([
        compressReceipt(file),
        prepareReceiptForOcr(file),
      ]);
      clearPendingReceiptUrl();
      pendingReceiptData = imageData;
      pendingReceiptUrl = imageData;
      removeExistingReceipt = false;
      renderReceiptPreview(pendingReceiptUrl);
      updateEditingDirtyState();
      suggestAmountFromReceipt(ocrImageData, requestId, initialAmount, initialDate);
    } catch (error) {
      event.target.value = "";
      showReceiptError(t(error.message === "too-large" ? "receiptTooLarge" : "receiptInvalid"));
    }
  });

  document.getElementById("receipt-remove").addEventListener("click", () => {
    receiptOcrRequest += 1;
    document.getElementById("e-receipt").value = "";
    pendingReceiptData = "";
    removeExistingReceipt = Boolean(EDITING_ID && EDITING_HAS_RECEIPT);
    clearPendingReceiptUrl();
    renderReceiptPreview();
    showReceiptError();
    showReceiptOcrStatus();
    receiptItems = [];
    receiptGrossAmount = 0;
    receiptScannedTotal = 0;
    renderReceiptItems();
    updateEditingDirtyState();
  });

  document.getElementById("receipt-item-add").addEventListener("click", () => {
    receiptItems.push({ id: crypto.randomUUID(), name: "", amount: 0, allocation: "even" });
    renderReceiptItems();
    document.querySelector(".receipt-item:last-child .receipt-item-name")?.focus();
  });
  document.getElementById("receipt-items-close").addEventListener("click", () => {
    if (receiptScannedTotal > 0) {
      document.getElementById("e-amount").value = receiptScannedTotal.toFixed(2);
    }
    receiptItems = [];
    receiptGrossAmount = 0;
    receiptScannedTotal = 0;
    renderReceiptItems();
    setActive("e-split", "even");
    onSplitChange("even");
    updateEditingDirtyState();
  });
  document.getElementById("receipt-items-list").addEventListener("change", (event) => {
    const row = event.target.closest(".receipt-item");
    const item = receiptItems.find((candidate) => candidate.id === row?.dataset.id);
    if (!item) return;
    if (event.target.classList.contains("receipt-item-name")) item.name = event.target.value;
    if (event.target.classList.contains("receipt-item-amount")) {
      const nextAmount = Math.max(0, Number(event.target.value) || 0);
      receiptGrossAmount = Math.max(0, receiptGrossAmount + nextAmount - item.amount);
      item.amount = nextAmount;
    }
    renderReceiptItems();
  });
  document.getElementById("receipt-items-list").addEventListener("click", (event) => {
    const row = event.target.closest(".receipt-item");
    const item = receiptItems.find((candidate) => candidate.id === row?.dataset.id);
    if (!item) return;
    const person = event.target.closest("[data-person]")?.dataset.person;
    const removeButton = event.target.closest(".receipt-item-remove");
    if (!person && !removeButton) return;
    if (person) {
      const selectedPeople = new Set(
        item.allocation === "even" ? ["self", "other"] : (item.allocation === "none" ? [] : [item.allocation]),
      );
      if (selectedPeople.has(person)) selectedPeople.delete(person);
      else selectedPeople.add(person);
      item.allocation = selectedPeople.size === 2 ? "even" : ([...selectedPeople][0] || "none");
    }
    if (removeButton) {
      receiptGrossAmount = Math.max(0, receiptGrossAmount - item.amount);
      receiptItems = receiptItems.filter((candidate) => candidate.id !== item.id);
      if (!receiptItems.length) {
        setActive("e-split", "even");
        onSplitChange("even");
      }
    }
    renderReceiptItems();
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
    } else if (receiptPointers.size === 1) {
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

  document.getElementById("e-amount").addEventListener("input", () => {
    receiptGrossAmount = (parseFloat(document.getElementById("e-amount").value) || 0) + receiptItemsExcludedAmount();
    updatePreview();
    if (receiptItems.length) renderReceiptItems();
  });
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
    const recurring = isPairExperience() && type === "expense" && !EDITING_ID && document.getElementById("e-recurring").checked;
    const participantUids = MULTI_EXPENSE_MODE
      ? (MULTI_SPLIT_MODE === "equal" ? activeGroupProfiles().map(([uid]) => uid) : selectedMultiParticipants())
      : [];
    if (MULTI_EXPENSE_MODE && participantUids.length === 0) {
      showReceiptError(t("selectParticipant"));
      return;
    }
    const payerUid = MULTI_EXPENSE_MODE ? document.getElementById("e-payer-multi").value : "";
    const payerProfile = activeGroupProfiles().find(([uid]) => uid === payerUid)?.[1];
    const legacyPayer = MULTI_EXPENSE_MODE && ["A", "B"].includes(payerProfile?.slot) ? payerProfile.slot : payerKey();
    const participantSlots = MULTI_EXPENSE_MODE
      ? participantUids.map((uid) => activeGroupProfiles().find(([memberUid]) => memberUid === uid)?.[1]?.slot).filter(Boolean)
      : [];
    const effectiveSplit = participantSlots.length === 1 && participantSlots[0] === "A"
      ? "a"
      : participantSlots.length === 1 && participantSlots[0] === "B"
      ? "b"
      : split;
    const existingEntry = EDITING_ID ? ENTRIES.find((entry) => entry.id === EDITING_ID) : null;
    const expense = {
      type, desc, amount, icon: getIcon(),
      payer: legacyPayer, split: effectiveSplit,
      shareA: effectiveSplit === "custom" ? customShareA() : null,
      payerUid: payerUid || null,
      multiSplitMode: MULTI_EXPENSE_MODE ? MULTI_SPLIT_MODE : null,
      participantUids: MULTI_EXPENSE_MODE ? participantUids : null,
      excludedAmount: 0,
      ts: expenseTimestamp(date, existingEntry?.ts),
    };
    const submitButton = ev.submitter;
    submitButton.disabled = true;
    showReceiptError();
    let createdEntryId = "";
    try {
      let recurringId = "";
      if (recurring) {
        recurringId = await store.createRecurring({
          kind: "recurringTemplate", active: true, interval: "monthly",
          desc: expense.desc, amount: expense.amount, icon: expense.icon,
          payer: expense.payer, split: expense.split, shareA: expense.shareA,
          startDate: date, generatedThrough: date, dayOfMonth: Number(date.split("-")[2]), ts: expense.ts,
        });
      }
      const expenseToSave = recurringId ? { ...expense, recurringId, recurringOccurrence: date } : expense;
      const entryId = EDITING_ID || await store.add(expenseToSave);
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
        await store.update(entryId, { ...expenseToSave, hasReceipt });
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

  document.getElementById("history-search").addEventListener("input", (event) => {
    HISTORY_SEARCH = event.target.value;
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
document.getElementById("balance-show-all").addEventListener("click", () => {
  SHOW_ALL_GROUP_DEBTS = !SHOW_ALL_GROUP_DEBTS;
  renderGroupBalance();
});
document.getElementById("swish-suggestions").addEventListener("click", (event) => {
  const button = event.target.closest(".swish-suggestion-action");
  if (!button) return;
  const { payee, payeeUid, amount } = button.dataset;
  if (!payee) {
    window.alert(t("demoMissingSwish"));
    return;
  }
  PENDING_GROUP_SETTLEMENT = { toUid: payeeUid, amount: Number(amount) };
  document.getElementById("settle-panel").hidden = false;
  window.open(buildSwishLink(payee, amount, settlementMessage()), "_blank", "noopener,noreferrer");
});
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

function renderGroupMembers(bankbook) {
  const profiles = activeGroupProfiles(bankbook);
  const realProfiles = profiles.filter(([, profile]) => !profile.demo);
  const ownMemberId = currentMemberId(bankbook);
  const maxMembers = groupExperienceType(bankbook) === "pair" ? 2 : MAX_MEMBERS;
  document.getElementById("group-member-list").innerHTML = profiles.map(([uid, profile], index) => {
    const name = profile.name || `Person ${index + 1}`;
    const avatar = profileAvatar(profile, name) || name.charAt(0).toUpperCase();
    const emojiClass = profile.avatarMode === "emoji" ? " avatar-emoji" : "";
    const color = validProfileColor(profile.color) ? profile.color : PROFILE_COLORS[index % PROFILE_COLORS.length];
    const selfLabel = uid === ownMemberId ? ` (${t("you")})` : "";
    const demoLabel = profile.demo ? `<em>${t("demoMember")}</em>` : "";
    const pendingLabel = profile.pending && !profile.claimedBy ? `<em class="group-pending">${t("waitingToJoin")}</em>` : "";
    const ownerLabel = uid === bankbook.createdBy ? `<em class="group-owner">${escapeHtml(t("owner"))}</em>` : "";
    return `<div class="group-member${profile.demo ? " is-demo" : ""}${profile.pending && !profile.claimedBy ? " is-pending" : ""}"><i class="group-member-avatar${emojiClass}" style="--profile-color:${color}">${escapeHtml(avatar)}</i><span>${escapeHtml(name)}${escapeHtml(selfLabel)}${ownerLabel}${demoLabel}${pendingLabel}</span></div>`;
  }).join("");
  const openProfiles = pendingGroupProfiles(bankbook).length;
  const full = openProfiles === 0 && realProfiles.length >= maxMembers;
  document.getElementById("invite-panel").hidden = full;
}

function activeGroupProfiles(bankbook = activeBankbook) {
  const realProfiles = Object.entries(bankbook?.members || {});
  const profiles = isMockTestGroup(bankbook) ? [...realProfiles, ...DEMO_MEMBERS] : realProfiles;
  return profiles
    .sort(([, left], [, right]) => MEMBER_SLOTS.indexOf(left.slot) - MEMBER_SLOTS.indexOf(right.slot));
}

function displayGroupProfiles(bankbook = activeBankbook) {
  const profiles = activeGroupProfiles(bankbook);
  const ownIndex = profiles.findIndex(([uid]) => uid === currentMemberId(bankbook));
  if (ownIndex <= 0) return profiles;
  return [profiles[ownIndex], ...profiles.slice(0, ownIndex), ...profiles.slice(ownIndex + 1)];
}

function isMockTestGroup(bankbook) {
  return bankbook?.demoMode === true;
}

function canRenameActiveGroup(bankbook = activeBankbook) {
  return bankbook?.createdBy === signedInUser?.uid;
}

function canDeleteActiveGroup(bankbook = activeBankbook) {
  return canRenameActiveGroup(bankbook);
}

function bankbookDisplayName(bankbook) {
  return isMockTestGroup(bankbook) ? "Lehman Bros" : (bankbook?.name || "Split Happens");
}

function renderActiveGroupName(bankbook = activeBankbook) {
  const groupName = bankbookDisplayName(bankbook);
  document.getElementById("active-group-name").textContent = groupName;
  document.querySelector(".brand").title = groupName;
}

function renderBankbookMenu(bankbooks) {
  showOnly("bankbook-screen");
  document.getElementById("create-group").textContent = t("createGroup");
  document.getElementById("join-bankbook-form").hidden = false;
  document.getElementById("bankbook-error").hidden = true;
  document.getElementById("group-list").innerHTML = bankbooks.length ? bankbooks.map((bankbook) => {
    const count = activeGroupProfiles(bankbook).length;
    const memberLabel = count === 1 ? t("groupMemberSingular") : t("groupMemberPlural");
    return `<button class="group-choice" type="button" data-bankbook-id="${escapeHtml(bankbook.id)}"><span><strong>${escapeHtml(bankbookDisplayName(bankbook))}</strong><small>${count} ${memberLabel}</small></span><b aria-hidden="true">›</b></button>`;
  }).join("") : `<p class="empty group-list-empty">${escapeHtml(t("groupPickerEmpty"))}</p>`;
}

function watchWaitingRoom(bankbookId) {
  if (unsubscribeWaitingRoom) unsubscribeWaitingRoom();
  const reference = fs.doc(db, "bankbooks", bankbookId);
  unsubscribeWaitingRoom = fs.onSnapshot(reference, async (snapshot) => {
    if (!snapshot.exists()) return;
    const updatedBankbook = { id: snapshot.id, ...snapshot.data() };
    activeBankbook = updatedBankbook;
    renderGroupMembers(updatedBankbook);
  }, (error) => showError("bankbook-error", error));
}

async function refreshBankbookMenu(autoOpen = true) {
  const bankbooks = await loadBankbooks();
  const inviteId = pendingInviteId();
  if (inviteId) {
    document.getElementById("invite-code").value = inviteId;
    await joinBankbook(inviteId);
    return;
  }
  renderBankbookMenu(bankbooks);
}

async function createAutomaticBankbook({ groupName, profileName, color, avatarMode, avatarEmoji, groupType, participantNames = [] }) {
  const reference = fs.doc(fs.collection(db, "bankbooks"));
  const pendingMembers = Object.fromEntries(participantNames.map((name, index) => {
    const slot = MEMBER_SLOTS[index + 1];
    return [`pending-${crypto.randomUUID()}`, {
      name,
      swish: "",
      color: PROFILE_COLORS[(index + 1) % PROFILE_COLORS.length],
      avatarMode: "letter",
      avatarEmoji: "",
      slot,
      pending: true,
      claimedBy: null,
    }];
  }));
  const bankbook = {
    name: groupName,
    groupType,
    multiGroup: groupType === "group",
    maxMembers: groupType === "pair" ? 2 : MAX_MEMBERS,
    createdBy: signedInUser.uid,
    memberIds: [signedInUser.uid],
    members: {
      [signedInUser.uid]: {
        name: profileName,
        swish: userProfile.swish,
        color,
        avatarMode,
        avatarEmoji,
        slot: "A",
      },
      ...pendingMembers,
    },
    createdAt: fs.serverTimestamp(),
  };
  await fs.setDoc(reference, bankbook);
  return { id: reference.id, ...bankbook };
}

function peopleFromBankbook(bankbook) {
  const profiles = [...activeGroupProfiles(bankbook)];
  if (!profiles.some(([, profile]) => profile.slot === "B")) {
    const fallback = DEMO_MEMBERS.find(([, profile]) => profile.slot === "B");
    if (fallback) profiles.push(fallback);
  }
  const personA = profiles.find(([, profile]) => profile.slot === "A");
  const personB = profiles.find(([, profile]) => profile.slot === "B");
  if (!personA || !personB) return null;
  const signedInProfile = profiles.find(([uid]) => uid === currentMemberId(bankbook));
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
    currentSlot: signedInProfile?.[1]?.slot === "B" ? "B" : "A",
  };
}

async function openBankbook(bankbook) {
  const people = peopleFromBankbook(bankbook);
  if (!people) {
    renderBankbookMenu(await loadBankbooks());
    showError("bankbook-error", new Error(t("missingGroupProfiles")));
    return;
  }
  if (unsubscribeWaitingRoom) {
    unsubscribeWaitingRoom();
    unsubscribeWaitingRoom = null;
  }
  activeBankbook = bankbook;
  GROUP_DATA_LOADING = true;
  const subscriptionToken = ++entrySubscriptionToken;
  applyExperienceMode(bankbook);
  PEOPLE = people.people;
  CURRENT_USER = people.currentSlot;
  localStorage.setItem(`bankboken-active-${signedInUser.uid}`, bankbook.id);
  renderActiveGroupName(bankbook);
  ENTRIES = [];
  RECURRING_TEMPLATES = [];
  HISTORY_FILTER = null;
  HISTORY_SEARCH = "";
  document.getElementById("history-search").value = "";
  HISTORY_PAGE = 1;
  SHOW_ALL_GROUP_DEBTS = false;
  if (unsubscribeEntries) unsubscribeEntries();
  await initStore();
  if (!APP_INITIALIZED) {
    initApp();
    APP_INITIALIZED = true;
  } else {
    updatePersonLabels();
    resetExpenseForm();
  }
  renderLoadingState();
  showOnly("app");
  unsubscribeEntries = store.subscribe((documents) => {
    if (subscriptionToken !== entrySubscriptionToken || activeBankbook?.id !== bankbook.id) return;
    RECURRING_TEMPLATES = isPairExperience()
      ? documents.filter((item) => item.kind === "recurringTemplate" && item.active !== false)
      : [];
    ENTRIES = documents.filter((item) => item.kind !== "recurringTemplate");
    GROUP_DATA_LOADING = false;
    render();
    ensureRecurringEntries(RECURRING_TEMPLATES, new Set(documents.map((item) => item.id)));
  }, () => {
    if (subscriptionToken !== entrySubscriptionToken || activeBankbook?.id !== bankbook.id) return;
    GROUP_DATA_LOADING = false;
    render();
  });
  watchActiveBankbook(bankbook.id);
}

function watchActiveBankbook(bankbookId) {
  if (unsubscribeActiveBankbook) unsubscribeActiveBankbook();
  unsubscribeActiveBankbook = fs.onSnapshot(fs.doc(db, "bankbooks", bankbookId), (snapshot) => {
    if (activeBankbook?.id !== bankbookId) return;
    if (!snapshot.exists()) return;
    const updatedBankbook = { id: snapshot.id, ...snapshot.data() };
    const people = peopleFromBankbook(updatedBankbook);
    if (!people) return;
    activeBankbook = updatedBankbook;
    applyExperienceMode(updatedBankbook);
    renderActiveGroupName(updatedBankbook);
    if (!document.getElementById("settings-modal").hidden) renderGroupMembers(updatedBankbook);
    PEOPLE = people.people;
    CURRENT_USER = people.currentSlot;
    if (APP_INITIALIZED) {
      updatePersonLabels();
      updatePreview();
      render();
    }
  }, (error) => {
    if (activeBankbook?.id !== bankbookId) return;
    setSync(false, error.message);
  });
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

let authSubmitting = false;

async function submitAuthForm() {
  if (authSubmitting) return;
  const submitButton = document.getElementById("auth-submit");
  authSubmitting = true;
  submitButton.disabled = true;
  document.getElementById("auth-error").hidden = true;
  document.getElementById("auth-success").hidden = true;
  const email = document.getElementById("auth-email").value.trim();
  const password = document.getElementById("auth-password").value;
  try {
    submitButton.textContent = t(registrationMode ? "creating" : "loggingIn");
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
  } finally {
    authSubmitting = false;
    submitButton.disabled = false;
    updateAuthLabels();
  }
}

document.getElementById("auth-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitAuthForm();
});

document.getElementById("auth-submit").addEventListener("click", (event) => {
  event.preventDefault();
  submitAuthForm();
});

function closeClaimMember(memberId = null) {
  document.getElementById("claim-member-modal").hidden = true;
  const resolve = CLAIM_MEMBER_RESOLVE;
  CLAIM_MEMBER_RESOLVE = null;
  if (resolve) resolve(memberId);
}

function choosePendingProfile(bankbook) {
  const profiles = pendingGroupProfiles(bankbook);
  if (!profiles.length) return Promise.resolve(null);
  const list = document.getElementById("claim-member-list");
  list.innerHTML = profiles.map(([uid, profile], index) => {
    const color = validProfileColor(profile.color) ? profile.color : PROFILE_COLORS[(index + 1) % PROFILE_COLORS.length];
    const avatar = profileAvatar(profile, profile.name) || "?";
    return `<button class="claim-member-option" type="button" data-claim-member="${escapeHtml(uid)}"><i style="--profile-color:${color}">${escapeHtml(avatar)}</i><span>${escapeHtml(profile.name)}</span></button>`;
  }).join("");
  document.getElementById("claim-member-modal").hidden = false;
  return new Promise((resolve) => { CLAIM_MEMBER_RESOLVE = resolve; });
}

document.getElementById("claim-member-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-claim-member]");
  if (button) closeClaimMember(button.dataset.claimMember);
});
document.getElementById("claim-member-close").addEventListener("click", () => closeClaimMember());
document.getElementById("claim-member-modal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeClaimMember();
});

async function joinBankbook(code) {
  const reference = fs.doc(db, "bankbooks", code);
  try {
    const initialSnapshot = await fs.getDoc(reference);
    if (!initialSnapshot.exists()) throw new Error(t("inviteNotFound"));
    const initialBankbook = initialSnapshot.data();
    const pendingProfiles = pendingGroupProfiles(initialBankbook);
    const claimedMemberId = initialBankbook.memberIds.includes(signedInUser.uid)
      ? currentMemberId({ id: initialSnapshot.id, ...initialBankbook })
      : await choosePendingProfile(initialBankbook);
    if (pendingProfiles.length && !claimedMemberId) return;
    await fs.runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists()) throw new Error(t("inviteNotFound"));
      const bankbook = snapshot.data();
      if (bankbook.memberIds.includes(signedInUser.uid)) return;
      const maxMembers = groupExperienceType(bankbook) === "pair" ? 2 : MAX_MEMBERS;
      if (bankbook.memberIds.length >= maxMembers) throw new Error(t(maxMembers === 2 ? "pairFull" : "groupAtCapacity"));
      const reservedProfile = claimedMemberId ? bankbook.members?.[claimedMemberId] : null;
      if (claimedMemberId && (!reservedProfile || reservedProfile.pending !== true || reservedProfile.claimedBy)) {
        throw new Error(t("profileAlreadyClaimed"));
      }
      const usedSlots = new Set(Object.values(bankbook.members || {}).map((member) => member.slot));
      const slot = reservedProfile?.slot || MEMBER_SLOTS.find((candidate) => !usedSlots.has(candidate));
      if (!slot) throw new Error(t("noGroupSpot"));
      const memberKey = claimedMemberId || signedInUser.uid;
      transaction.update(reference, {
        memberIds: [...bankbook.memberIds, signedInUser.uid],
        members: {
          ...bankbook.members,
          [memberKey]: {
            ...(reservedProfile || {}),
            name: reservedProfile?.name || userProfile.name,
            swish: userProfile.swish,
            color: reservedProfile?.color || userProfile.color || defaultProfileColor(signedInUser.uid),
            avatarMode: reservedProfile?.avatarMode || userProfile.avatarMode || "letter",
            avatarEmoji: reservedProfile?.avatarEmoji || userProfile.avatarEmoji || "",
            slot,
            pending: false,
            claimedBy: signedInUser.uid,
          },
        },
      });
    });
    document.getElementById("invite-code").value = "";
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("invite");
    window.history.replaceState({}, "", cleanUrl);
    const snapshot = await fs.getDoc(reference);
    await openBankbook({ id: snapshot.id, ...snapshot.data() });
  } catch (error) {
    showOnly("bankbook-screen");
    showError("bankbook-error", error);
  }
}

document.getElementById("join-bankbook-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await joinBankbook(parseInvite(document.getElementById("invite-code").value));
});

document.getElementById("group-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-bankbook-id]");
  if (!button) return;
  const bankbook = (await loadBankbooks()).find((item) => item.id === button.dataset.bankbookId);
  if (!bankbook) return;
  if (!peopleFromBankbook(bankbook)) {
    activeBankbook = bankbook;
    watchWaitingRoom(bankbook.id);
    openSettings();
    return;
  }
  await openBankbook(bankbook);
});

function closeCreateGroup() {
  document.getElementById("create-group-modal").hidden = true;
  document.getElementById("avatar-modal").hidden = true;
  document.getElementById("create-group-error").hidden = true;
  AVATAR_TARGET = "settings";
}

function createGroupParticipantNames() {
  return [...document.querySelectorAll("#create-group-participant-list input")]
    .map((input) => input.value.trim());
}

function activeCreateGroupType() {
  return document.querySelector("#create-group-type [data-group-type].active")?.dataset.groupType || "pair";
}

function setCreateGroupFieldError(id, message = "") {
  const element = document.getElementById(id);
  element.textContent = message;
  element.hidden = !message;
}

function updateCreateGroupCopy() {
  const isPair = activeCreateGroupType() === "pair";
  document.getElementById("create-group-name-label").textContent = t(isPair ? "groupNameOptional" : "groupName");
  document.getElementById("create-group-participants-help").textContent = t(isPair ? "pairParticipantsHelp" : "groupParticipantsHelp");
  const profileName = document.getElementById("create-group-profile-name").value.trim() || t("you");
  const partnerName = createGroupParticipantNames()[0] || "…";
  document.getElementById("create-group-name").placeholder = isPair ? `${profileName} & ${partnerName}` : "";
}

function updateCreateGroupFormState(showErrors = false) {
  const groupType = activeCreateGroupType();
  const groupName = document.getElementById("create-group-name").value.trim();
  const profileName = document.getElementById("create-group-profile-name").value.trim();
  const participantNames = createGroupParticipantNames();
  const participantsComplete = participantNames.length >= (groupType === "pair" ? 1 : 2) && participantNames.every(Boolean);
  const normalizedNames = [profileName, ...participantNames].filter(Boolean).map((name) => name.toLocaleLowerCase(locale()));
  const namesAreUnique = new Set(normalizedNames).size === normalizedNames.length;
  const valid = (groupType === "pair" || Boolean(groupName)) && Boolean(profileName) && participantsComplete && namesAreUnique;

  if (showErrors) {
    setCreateGroupFieldError("create-group-name-error", groupType === "group" && !groupName ? t("requiredGroupName") : "");
    setCreateGroupFieldError("create-group-profile-error", !profileName ? t("requiredProfileName") : "");
    setCreateGroupFieldError("create-group-participants-error", !participantsComplete
      ? t("requiredParticipantNames")
      : !namesAreUnique ? t("uniqueParticipantNames") : "");
  } else {
    setCreateGroupFieldError("create-group-name-error");
    setCreateGroupFieldError("create-group-profile-error");
    setCreateGroupFieldError("create-group-participants-error", participantsComplete && profileName && !namesAreUnique ? t("uniqueParticipantNames") : "");
  }
  document.getElementById("create-group-save").disabled = !valid;
  return valid;
}

function renderCreateGroupParticipants(groupType, names = []) {
  const isPair = groupType === "pair";
  const minimum = isPair ? 1 : 2;
  const maximum = isPair ? 1 : MAX_MEMBERS - 1;
  const nextNames = names.slice(0, maximum);
  while (nextNames.length < minimum) nextNames.push("");
  const list = document.getElementById("create-group-participant-list");
  list.innerHTML = nextNames.map((name, index) => `
    <div class="create-group-participant-row">
      <input type="text" maxlength="40" autocomplete="off" value="${escapeHtml(name)}" placeholder="${escapeHtml(isPair ? t("partnerName") : t("participantName", { number: index + 2 }))}" aria-label="${escapeHtml(isPair ? t("partnerName") : t("participantName", { number: index + 2 }))}" />
      <button type="button" data-remove-participant="${index}" aria-label="${escapeHtml(t("delete"))}" ${nextNames.length <= minimum ? "hidden" : ""}>×</button>
    </div>`).join("");
  document.getElementById("create-group-add-participant").hidden = isPair || nextNames.length >= maximum;
  updateCreateGroupCopy();
  updateCreateGroupFormState();
}

function openCreateGroup() {
  CREATED_BANKBOOK = null;
  AVATAR_TARGET = "create";
  document.getElementById("create-group-name").value = "";
  document.getElementById("create-group-profile-name").value = "";
  document.getElementById("create-group-profile-name").placeholder = t("yourName");
  document.querySelectorAll("#create-group-type [data-group-type]").forEach((button) =>
    button.classList.toggle("active", button.dataset.groupType === "pair"));
  renderCreateGroupParticipants("pair");
  SETTINGS_COLOR = validProfileColor(userProfile.color) ? userProfile.color : defaultProfileColor(signedInUser.uid);
  SETTINGS_AVATAR_MODE = userProfile.avatarMode === "emoji" ? "emoji" : "letter";
  SETTINGS_AVATAR_EMOJI = firstGrapheme(userProfile.avatarEmoji || "");
  document.getElementById("create-group-form").hidden = false;
  document.getElementById("create-group-success").hidden = true;
  document.getElementById("create-group-error").hidden = true;
  updateColorPicker();
  updateAvatarSettings();
  document.getElementById("create-group-modal").hidden = false;
  window.setTimeout(() => document.getElementById("create-group-name").focus(), 0);
}

document.getElementById("create-group").addEventListener("click", openCreateGroup);
document.getElementById("create-group-close").addEventListener("click", closeCreateGroup);
document.getElementById("create-group-modal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeCreateGroup();
});
document.getElementById("create-group-profile-name").addEventListener("input", updateAvatarSettings);
document.getElementById("create-group-form").addEventListener("input", () => {
  updateCreateGroupCopy();
  updateCreateGroupFormState();
});
document.getElementById("create-group-type").addEventListener("click", (event) => {
  const button = event.target.closest("[data-group-type]");
  if (!button) return;
  const names = createGroupParticipantNames();
  document.querySelectorAll("#create-group-type [data-group-type]").forEach((option) => option.classList.toggle("active", option === button));
  renderCreateGroupParticipants(button.dataset.groupType, names);
});
document.getElementById("create-group-add-participant").addEventListener("click", () => {
  const groupType = document.querySelector("#create-group-type [data-group-type].active")?.dataset.groupType || "pair";
  renderCreateGroupParticipants(groupType, [...createGroupParticipantNames(), ""]);
  document.querySelector("#create-group-participant-list .create-group-participant-row:last-child input")?.focus();
});
document.getElementById("create-group-participant-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-participant]");
  if (!button) return;
  const groupType = document.querySelector("#create-group-type [data-group-type].active")?.dataset.groupType || "pair";
  const names = createGroupParticipantNames();
  names.splice(Number(button.dataset.removeParticipant), 1);
  renderCreateGroupParticipants(groupType, names);
});
document.getElementById("create-group-avatar-trigger").addEventListener("click", () => {
  AVATAR_TARGET = "create";
  AVATAR_MODAL_ORIGINAL = {
    color: SETTINGS_COLOR,
    mode: SETTINGS_AVATAR_MODE,
    emoji: SETTINGS_AVATAR_EMOJI,
  };
  document.getElementById("create-group-modal").hidden = true;
  document.getElementById("avatar-modal").hidden = false;
  updateColorPicker();
});
document.getElementById("create-group-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const profileName = document.getElementById("create-group-profile-name").value.trim();
  const groupType = activeCreateGroupType();
  const participantNames = createGroupParticipantNames();
  if (!updateCreateGroupFormState(true)) return;
  const enteredGroupName = document.getElementById("create-group-name").value.trim();
  const groupName = enteredGroupName || `${profileName} & ${participantNames[0]}`;
  const saveButton = document.getElementById("create-group-save");
  saveButton.disabled = true;
  document.getElementById("create-group-error").hidden = true;
  try {
    const avatarMode = SETTINGS_AVATAR_MODE === "emoji" && SETTINGS_AVATAR_EMOJI ? "emoji" : "letter";
    CREATED_BANKBOOK = await createAutomaticBankbook({
      groupName,
      profileName,
      color: SETTINGS_COLOR,
      avatarMode,
      avatarEmoji: avatarMode === "emoji" ? firstGrapheme(SETTINGS_AVATAR_EMOJI) : "",
      groupType,
      participantNames,
    });
    activeBankbook = CREATED_BANKBOOK;
    document.getElementById("create-group-invite-link").value = invitationUrl(CREATED_BANKBOOK.id);
    document.getElementById("create-group-form").hidden = true;
    document.getElementById("create-group-success").hidden = false;
    renderBankbookMenu(await loadBankbooks());
    document.getElementById("create-group-modal").hidden = false;
  } catch (error) {
    showError("create-group-error", error);
  } finally {
    saveButton.disabled = false;
  }
});
function showCopiedState(copyButton) {
  copyButton.setAttribute("aria-label", t("copied"));
  copyButton.title = t("copied");
  copyButton.classList.add("is-copied");
  window.setTimeout(() => {
    copyButton.setAttribute("aria-label", t("copyInviteLink"));
    copyButton.title = t("copyInviteLink");
    copyButton.classList.remove("is-copied");
  }, 1500);
}

document.getElementById("create-group-copy-invite").addEventListener("click", async () => {
  await navigator.clipboard.writeText(document.getElementById("create-group-invite-link").value);
  showCopiedState(document.getElementById("create-group-copy-invite"));
});
document.getElementById("create-group-continue").addEventListener("click", async () => {
  if (!CREATED_BANKBOOK) return;
  const bankbook = CREATED_BANKBOOK;
  closeCreateGroup();
  await openBankbook(bankbook);
});

document.getElementById("copy-invite").addEventListener("click", async () => {
  await navigator.clipboard.writeText(document.getElementById("invite-link").value);
  showCopiedState(document.getElementById("copy-invite"));
});

function closeSettings() {
  document.getElementById("settings-modal").hidden = true;
  document.getElementById("avatar-modal").hidden = true;
  document.getElementById("settings-error").hidden = true;
}

function showSettingsFromAvatar() {
  document.getElementById("avatar-modal").hidden = true;
  document.getElementById(AVATAR_TARGET === "create" ? "create-group-modal" : "settings-modal").hidden = false;
  updateAvatarSettings();
  document.getElementById(AVATAR_TARGET === "create" ? "create-group-avatar-trigger" : "settings-avatar-trigger").focus();
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

function openSettings() {
  AVATAR_TARGET = "settings";
  const ownMemberId = currentMemberId();
  const groupProfile = activeBankbook.members?.[ownMemberId] || userProfile;
  document.getElementById("settings-name").value = groupProfile.name;
  SETTINGS_COLOR = validProfileColor(groupProfile.color) ? groupProfile.color : defaultProfileColor(signedInUser.uid);
  SETTINGS_AVATAR_MODE = groupProfile.avatarMode === "emoji" ? "emoji" : "letter";
  SETTINGS_AVATAR_EMOJI = firstGrapheme(groupProfile.avatarEmoji || "");
  updateColorPicker();
  document.getElementById("invite-link").value = invitationUrl(activeBankbook.id);
  const groupManagement = document.getElementById("group-management");
  groupManagement.hidden = !canRenameActiveGroup();
  document.getElementById("delete-group").hidden = !canDeleteActiveGroup();
  document.getElementById("settings-group-name").value = bankbookDisplayName(activeBankbook);
  renderGroupMembers(activeBankbook);
  document.getElementById("settings-error").hidden = true;
  document.getElementById("settings-modal").hidden = false;
}

document.getElementById("settings-trigger").addEventListener("click", openSettings);

function openStatistics() {
  const now = new Date();
  const fromInput = document.getElementById("statistics-from");
  const toInput = document.getElementById("statistics-to");
  if (!fromInput.value) fromInput.value = inputDateValue(new Date(now.getFullYear(), now.getMonth(), 1));
  if (!toInput.value) toInput.value = inputDateValue(now);
  document.getElementById("statistics-modal").hidden = false;
  renderStatistics();
}

function closeStatistics() {
  document.getElementById("statistics-modal").hidden = true;
}

document.getElementById("statistics-trigger").addEventListener("click", openStatistics);
document.getElementById("statistics-close").addEventListener("click", closeStatistics);
document.getElementById("statistics-period").addEventListener("click", (event) => {
  const button = event.target.closest("[data-statistics-period]");
  if (!button) return;
  STATISTICS_PERIOD = button.dataset.statisticsPeriod;
  renderStatistics();
});
document.getElementById("statistics-custom-range").addEventListener("change", renderStatistics);
document.getElementById("statistics-modal").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeStatistics();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !document.getElementById("statistics-modal").hidden) closeStatistics();
});

async function deleteCollectionDocuments(collectionReference) {
  const snapshot = await fs.getDocs(collectionReference);
  await Promise.all(snapshot.docs.map((document) => fs.deleteDoc(document.ref)));
}

document.getElementById("delete-group").addEventListener("click", async () => {
  if (!canDeleteActiveGroup()) return;
  const groupName = bankbookDisplayName(activeBankbook);
  const confirmed = window.confirm(t("deleteGroupConfirm", { name: groupName }));
  if (!confirmed) return;
  const deletedBankbookId = activeBankbook.id;
  try {
    await deleteCollectionDocuments(fs.collection(db, "bankbooks", deletedBankbookId, "receipts"));
    await deleteCollectionDocuments(fs.collection(db, "bankbooks", deletedBankbookId, "entries"));
    await fs.deleteDoc(fs.doc(db, "bankbooks", deletedBankbookId));
    localStorage.removeItem(`bankboken-active-${signedInUser.uid}`);
    closeSettings();
    if (unsubscribeEntries) unsubscribeEntries();
    if (unsubscribeActiveBankbook) unsubscribeActiveBankbook();
    if (unsubscribeWaitingRoom) unsubscribeWaitingRoom();
    unsubscribeEntries = null;
    unsubscribeActiveBankbook = null;
    unsubscribeWaitingRoom = null;
    activeBankbook = null;
    await refreshBankbookMenu(false);
  } catch (error) {
    showError("settings-error", error);
  }
});

document.getElementById("switch-group").addEventListener("click", async () => {
  closeSettings();
  if (unsubscribeEntries) unsubscribeEntries();
  if (unsubscribeActiveBankbook) unsubscribeActiveBankbook();
  if (unsubscribeWaitingRoom) unsubscribeWaitingRoom();
  unsubscribeEntries = null;
  unsubscribeActiveBankbook = null;
  unsubscribeWaitingRoom = null;
  activeBankbook = null;
  await refreshBankbookMenu(false);
});

document.getElementById("settings-name").addEventListener("input", updateAvatarSettings);
document.getElementById("settings-avatar-trigger").addEventListener("click", () => {
  AVATAR_TARGET = "settings";
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

document.getElementById("recurring-settings-list").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-recurring-stop]");
  if (!button || !confirm(t("stopRecurringConfirm"))) return;
  button.disabled = true;
  try { await store.remove(button.dataset.recurringStop); }
  catch (error) { console.error(error); button.disabled = false; setSync(false, t("syncFailed")); }
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
  if (event.key === "Escape" && !document.getElementById("create-group-modal").hidden) closeCreateGroup();
});
document.getElementById("settings-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("settings-name").value.trim();
  if (!name || !activeBankbook) return;
  try {
    const avatarMode = SETTINGS_AVATAR_MODE === "emoji" && SETTINGS_AVATAR_EMOJI ? "emoji" : "letter";
    const avatarEmoji = avatarMode === "emoji" ? firstGrapheme(SETTINGS_AVATAR_EMOJI) : "";
    const ownMemberId = currentMemberId();
    const members = {
      ...activeBankbook.members,
      [ownMemberId]: {
        ...activeBankbook.members[ownMemberId],
        name,
        color: SETTINGS_COLOR,
        avatarMode,
        avatarEmoji,
      },
    };
    const groupName = document.getElementById("settings-group-name").value.trim();
    const keepDemoProfiles = isMockTestGroup(activeBankbook);
    const groupChanges = canRenameActiveGroup() && groupName
      ? (keepDemoProfiles
        ? { name: groupName, multiGroup: true, demoMode: true }
        : { name: groupName })
      : {};
    await fs.updateDoc(fs.doc(db, "bankbooks", activeBankbook.id), { members, ...groupChanges });
    activeBankbook = { ...activeBankbook, members, ...groupChanges };
    renderActiveGroupName(activeBankbook);
    if (APP_INITIALIZED && PEOPLE[CURRENT_USER]) {
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
    }
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
  firebaseApp = appApi.initializeApp(FIREBASE_CONFIG, "bankboken-multi");
  db = fs.getFirestore(firebaseApp);
  auth = authApi.getAuth(firebaseApp);
  try {
    await authApi.setPersistence(auth, authApi.browserLocalPersistence);
  } catch {
    await authApi.setPersistence(auth, authApi.browserSessionPersistence);
  }
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
      showError("auth-error", new Error(t("missingAccountProfile")));
      return;
    }
    await refreshBankbookMenu();
  });
}

applyLanguage();
initializeFirebase().catch((error) => showError("auth-error", error));
