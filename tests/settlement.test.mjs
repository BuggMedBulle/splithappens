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
const rowSource = app.slice(app.indexOf('function makeSwipeableRow('), app.indexOf('  const deleteButton =', app.indexOf('function makeSwipeableRow('))) + '\n}';
function element() { return {children: [], classList: {add() {}}, appendChild(child) {this.children.push(child);}, replaceChildren(...children) {this.children = children;}, addEventListener(_, cb) {this.click = cb;} }; }
for (const owner of [true, false]) test(`settlement delete button owner=${owner}`, async () => {
  let removed = 0;
  const c = vm.createContext({document: {createElement: element}, signedInUser: {uid:'a'}, canDeleteActiveGroup: () => owner, LANGUAGE:'sv', kr: n => n + ' kr', confirm: () => true, store: {remove: async () => removed++}, creditUI: {error:e=>e}, showReceiptError() {} });
  vm.runInContext(rowSource, c);
  const content = c.makeSwipeableRow(element(), {type:'settlement', id:'duplicate', amount:200});
  assert.equal(content.children.length, owner ? 1 : 0);
  if (owner) {
    await content.children[0].click({stopPropagation(){}});
    assert.equal(removed, 1);
    c.canDeleteActiveGroup = () => false;
    await content.children[0].click({stopPropagation(){}});
    assert.equal(removed, 1);
  }
});
