import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const app = readFileSync(new URL('../public/bankboken-multi/app.js', import.meta.url), 'utf8');
const confirmSource = app.slice(app.indexOf('async function confirmSettlement()'), app.indexOf('//  FORM', app.indexOf('async function confirmSettlement()')));
function setup(save) {
  const button = { disabled: false };
  const pending = { id: 'swish-1', fromUid: 'a', toUid: 'b', amount: 200, ts: 1 };
  const c = vm.createContext({ SAVING_SETTLEMENT: false, PENDING_GROUP_SETTLEMENT: pending, usesGroupExperience: () => true, currentMemberId: () => 'a', activeGroupProfiles: () => [['a', {slot:'A'}]], CURRENT_USER: 'A', store: {createIfMissing: save}, document: {getElementById: () => button}, showReceiptError: () => {}, creditUI: {error: e => e} });
  button.scrollIntoView = () => {};
  vm.runInContext(confirmSource, c);
  return {c, button};
}
test('concurrent clicks write once and a later click without pending payment does nothing', async () => {
  let calls = 0, release;
  const {c, button} = setup(async () => {calls++; await new Promise(r => release = r);});
  const first = c.confirmSettlement();
  assert.equal(button.disabled, true);
  await c.confirmSettlement();
  assert.equal(calls, 1);
  release(); await first;
  await c.confirmSettlement();
  assert.equal(calls, 1);
  assert.equal(button.disabled, false);
});
test('retry after uncertain failure reuses the same payment ID', async () => {
  const ids = [];
  const {c, button} = setup(async id => {ids.push(id); if(ids.length === 1) throw Error('offline');});
  await c.confirmSettlement();
  assert.equal(button.disabled, false);
  assert.ok(c.PENDING_GROUP_SETTLEMENT);
  await c.confirmSettlement();
  assert.deepEqual(ids, ['swish-1','swish-1']);
  assert.equal(c.PENDING_GROUP_SETTLEMENT, null);
});
test('different signed-in payer cannot confirm pending payment', async () => {
  let calls = 0;
  const {c} = setup(async () => calls++);
  c.currentMemberId = () => 'other';
  await c.confirmSettlement();
  assert.equal(calls, 0);
});

const manualSource = app.slice(app.indexOf('function manualSwishEntry('), app.indexOf('function renderManualSwishAction('));
const c = vm.createContext({ LANGUAGE: 'sv' });
vm.runInContext(manualSource, c);
const profiles = [['a', {slot:'A'}], ['b', {slot:'B'}], ['guest', {name:'Guest'}]];
test('manual payment preserves sender, receiver and exact amount including comma input', () => {
  const e = c.manualSwishEntry('guest','b','123,45',profiles);
  assert.equal(e.payerUid, 'guest'); assert.equal(e.recipientUid, 'b'); assert.equal(e.amount, 123.45);
});
test('manual payment rejects same participant, outsiders and invalid amounts', () => {
  for (const args of [['a','a','10'],['missing','b','10'],['a','b','0'],['a','b','-1'],['a','b','1.001'],['a','b','abc'],['a','b','Infinity']]) {
    assert.throws(() => c.manualSwishEntry(...args, profiles));
  }
});
const rowSource = app.slice(app.indexOf('function makeSwipeableRow('), app.indexOf('function renderBalance('));
function element() { return {children: [], handlers:{}, classList: {add(){}, contains(){return false;}}, appendChild(child) {this.children.push(child);}, replaceChildren(...children) {this.children=children;}, setAttribute(){}, addEventListener(name, cb) {this.handlers[name]=cb;} }; }
for (const owner of [true, false]) test(`swipe delete owner=${owner}`, async () => {
  let removed=0;
  const c=vm.createContext({document:{createElement:element}, signedInUser:{uid:'a'}, canDeleteActiveGroup:()=>owner, t:x=>x, confirm:()=>true, closeSwipeRow(){}, store:{remove:async()=>removed++}, creditUI:{error:e=>e}, showReceiptError(){} });
  vm.runInContext(rowSource,c);
  const row=element(); const content=c.makeSwipeableRow(row,{type:'settlement',id:'duplicate'});
  assert.equal(row.children.length,owner?2:1);
  assert.equal(Boolean(content.handlers.touchstart),owner);
  if(owner) {
    await row.children[0].handlers.click({stopPropagation(){}}); assert.equal(removed,1);
    c.canDeleteActiveGroup=()=>false;
    await row.children[0].handlers.click({stopPropagation(){}}); assert.equal(removed,1);
  }
});
