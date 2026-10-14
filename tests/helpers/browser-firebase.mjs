import { memoryDatabase } from "/tests/helpers/transaction-memory.mjs";
const seed = {
  "users/alice": { name: "Alice", swish: "46700000001" },
  "users/bob": { name: "Bob", swish: "46700000002" },
  "bankbooks/pair": { id: "pair", name: "Testpar", createdBy: "alice", groupType: "pair", memberIds: ["alice", "bob"], members: {
    alice: { name: "Alice", swish: "46700000001", slot: "A", color: "#5c8de8" },
    bob: { name: "Bob", swish: "46700000002", slot: "B", color: "#62b86b" },
  } },
  "bankbooks/pair/entries/private": { type: "expense", desc: "Privat utlägg", payer: "B", split: "a", amount: 1200, ts: Date.parse("2026-10-10T12:00:00Z") },
};
const storageKey = "split-browser-test-data";
const initial = JSON.parse(localStorage.getItem(storageKey) || "null") || seed;
const memory = memoryDatabase(initial);
const paths = new Set(Object.keys(initial));
const observers = new Set();
export const getFirestore = () => memory.db;
export const collection = memory.fs.collection;
export function doc(parent, ...parts) {
  if (parent?.path && !parts.length) parts = [`test-${crypto.randomUUID()}`];
  return memory.fs.doc(parent, ...parts);
}
const snap = ref => { const value = memory.read(ref.path); return { id: ref.id, exists: () => value != null, data: () => value }; };
export const getDoc = async ref => snap(ref);
export const where = (field, op, value) => ({ field, op, value });
export const orderBy = (field, direction) => ({ field, direction });
export const query = (ref, ...constraints) => ({ ...ref, constraints });
function querySnapshot(ref) {
  const docs = [...paths].filter(path => path.startsWith(`${ref.path}/`) && !path.slice(ref.path.length + 1).includes("/"))
    .map(path => snap({ path, id: path.split("/").at(-1) })).filter(s => s.exists())
    .filter(s => (ref.constraints || []).every(c => !c.op || (c.op === "array-contains" ? s.data()[c.field]?.includes(c.value) : s.data()[c.field] === c.value)))
    .sort((a, b) => Number(b.data().ts || 0) - Number(a.data().ts || 0));
  return { docs };
}
function persist() { const data = {}; for (const path of paths) { const value = memory.read(path); if (value) data[path] = value; } localStorage.setItem(storageKey, JSON.stringify(data)); }
function notify() { for (const o of observers) queueMicrotask(() => o.callback(o.ref.path.split("/").length % 2 === 0 ? snap(o.ref) : querySnapshot(o.ref))); }
export function onSnapshot(ref, callback) { const o = { ref, callback }; observers.add(o); queueMicrotask(() => callback(ref.path.split("/").length % 2 === 0 ? snap(ref) : querySnapshot(ref))); return () => observers.delete(o); }
export async function runTransaction(db, callback) {
  const result = await memory.fs.runTransaction(db, tx => callback({
    get: tx.get,
    set(ref, value) { paths.add(ref.path); tx.set(ref, value); },
    update(ref, value) { paths.add(ref.path); tx.update(ref, value); },
    delete(ref) { tx.delete(ref); },
  }));
  persist(); notify(); return result;
}
export const setDoc = (ref, value) => runTransaction(memory.db, tx => tx.set(ref, value));
export const updateDoc = (ref, value) => runTransaction(memory.db, tx => tx.update(ref, value));
export const deleteDoc = ref => runTransaction(memory.db, tx => tx.delete(ref));
export const addDoc = async (ref, value) => { const newRef = doc(ref); await setDoc(newRef, value); return newRef; };
export const getDocs = async ref => querySnapshot(ref);
export const serverTimestamp = () => Date.now();
window.__testDatabase = () => { const data = {}; for (const path of paths) { const value = memory.read(path); if (value) data[path] = value; } return data; };
