// Existing financial rules, extracted without changing their behavior.
// Positive pair balance means B owes A. Group balances are integer cents.

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

function entryPayerUid(entry, profiles) {
  return entry.payerUid || profiles.find(([, profile]) => profile.slot === entry.payer)?.[0] || "";
}
function profileUidForSlot(slot, profiles) {
  return profiles.find(([, profile]) => profile.slot === slot)?.[0] || "";
}

function groupNetBalances(entries, profiles) {
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

function optimizedSwishPlan(entries, profiles) {
  const balances = groupNetBalances(entries, profiles);
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


export { sharesOf, balanceOf, groupNetBalances, optimizedSwishPlan };
