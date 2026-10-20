import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const server = createServer(async (req, res) => {
  const path = resolve(root, `.${new URL(req.url, "http://localhost").pathname}`);
  if (!path.startsWith(root + "/")) return res.writeHead(403).end();
  try {
    res.setHeader("Content-Type", { ".js": "text/javascript", ".mjs": "text/javascript", ".html": "text/html", ".css": "text/css", ".svg": "image/svg+xml" }[extname(path)] || "application/octet-stream");
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = origin + "/public/bankboken-multi/index.html";
let browser;
let releaseAuth;
const authGate = new Promise(resolve => { releaseAuth = resolve; });
try {
  browser = await chromium.launch({ headless: true, ...(process.env.CREDIT_TEST_CHROME ? { executablePath: process.env.CREDIT_TEST_CHROME } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "sv-SE" });
  const seed = {
    "users/alice": { name: "Alice", swish: "46700000001" },
    "bankbooks/guest-invite": { name: "Testgästgrupp", createdBy: "alice", groupType: "group", memberIds: ["alice"], members: {
      alice: { name: "Alice", slot: "A", swish: "46700000001" },
      "reserved-guest": { name: "Gästdeltagare", slot: "B", swish: "", pending: true, claimedBy: null },
    } },
  };
  await context.addInitScript(seed => {
    if (!localStorage.getItem("split-browser-test-data")) localStorage.setItem("split-browser-test-data", JSON.stringify(seed));
  }, seed);
  // Every non-local request is intercepted or blocked: these tests cannot send email.
  await context.route("**/*", async route => {
    const requestUrl = route.request().url();
    if (requestUrl.includes("firebase-app.js")) return route.fulfill({ contentType: "text/javascript", body: "export const initializeApp = () => ({});" });
    if (requestUrl.includes("firebase-firestore.js")) return route.fulfill({ contentType: "text/javascript", body: `export * from "${origin}/tests/helpers/browser-firebase.mjs";` });
    if (requestUrl.includes("firebase-auth.js")) {
      await authGate;
      return route.fulfill({ contentType: "text/javascript", body: `
        let callback;
        const auth = {};
        export const getAuth = () => auth;
        export const browserLocalPersistence = {}, browserSessionPersistence = {};
        export const setPersistence = async () => {};
        export const onAuthStateChanged = (_auth, cb) => { callback = cb; queueMicrotask(() => cb(JSON.parse(localStorage.getItem("test-auth-user") || "null"))); };
        export const signInAnonymously = async () => {
          window.__guestCalls = (window.__guestCalls || 0) + 1;
          if (window.__guestError) throw { code: window.__guestError };
          const user = { uid: "guest-test", isAnonymous: true };
          localStorage.setItem("test-auth-user", JSON.stringify(user));
          queueMicrotask(() => callback(user));
          return { user };
        };
        export const signOut = async () => { localStorage.removeItem("test-auth-user"); callback(null); };
        export const sendPasswordResetEmail = async (auth, email) => {
          (window.__resetCalls ||= []).push({ email, language: auth.languageCode });
          await new Promise(resolve => setTimeout(resolve, 100));
          if (window.__resetError) throw { code: window.__resetError };
        };
        export const signInWithEmailAndPassword = async () => { window.__loginCalls = (window.__loginCalls || 0) + 1; throw { code: "auth/invalid-credential" }; };
      ` });
    }
    if (requestUrl.startsWith(origin + "/")) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("#auth-reset").isDisabled(), true);
  assert.equal(await page.locator("#auth-guest").isDisabled(), true);
  releaseAuth();
  await page.waitForFunction(() => !document.getElementById("auth-reset").disabled);
  await page.locator("#auth-reset").click();
  assert.match(await page.locator("#auth-error").innerText(), /e-postadress/);
  await page.locator("#auth-email").fill("invalid");
  await page.locator("#auth-reset").click();
  assert.match(await page.locator("#auth-error").innerText(), /giltig/);
  assert.equal(await page.evaluate(() => (window.__resetCalls || []).length), 0);
  await page.locator("#auth-email").fill(" test@example.test ");
  await page.locator("#auth-reset").click();
  assert.equal(await page.locator("#auth-reset").isDisabled(), true);
  await page.evaluate(() => document.getElementById("auth-reset").click());
  await page.locator("#auth-success").waitFor({ state: "visible" });
  assert.match(await page.locator("#auth-success").innerText(), /Om adressen/);
  assert.deepEqual(await page.evaluate(() => window.__resetCalls), [{ email: "test@example.test", language: "sv" }]);
  assert.equal(await page.locator("#auth-password").inputValue(), "");
  for (const [code, text] of [["auth/network-request-failed", /uppkopplingen/], ["auth/too-many-requests", /För många/]]) {
    await page.evaluate(code => { window.__resetError = code; }, code);
    await page.locator("#auth-reset").click();
    await page.locator("#auth-error").waitFor({ state: "visible" });
    assert.match(await page.locator("#auth-error").innerText(), text);
    assert.equal(await page.locator("#auth-reset").isEnabled(), true);
    assert.equal(await page.locator("#auth-success").isVisible(), false);
  }
  await page.evaluate(() => { window.__resetError = "auth/user-not-found"; });
  await page.locator("#auth-reset").click();
  await page.locator("#auth-success").waitFor({ state: "visible" });
  assert.match(await page.locator("#auth-success").innerText(), /Om adressen/);
  await mkdir(new URL("../work/", import.meta.url), { recursive: true });
  await page.screenshot({ path: new URL("../work/password-reset-test.png", import.meta.url).pathname });
  await page.locator("#auth-submit").click();
  assert.equal(await page.evaluate(() => window.__loginCalls || 0), 0);
  await page.locator("#auth-password").fill("test-password");
  await page.locator("#auth-submit").click();
  await page.waitForFunction(() => !document.getElementById("auth-submit").disabled);
  assert.match(await page.locator("#auth-error").innerText(), /Fel e-postadress eller lösenord/);
  assert.equal(await page.evaluate(() => window.__loginCalls), 1);
  await page.goto(url + "?invite=guest-invite");
  await page.waitForFunction(() => !document.getElementById("auth-guest").disabled);
  await page.locator("#auth-guest").click();
  assert.equal(await page.locator("#auth-password").isVisible(), false);
  await page.locator("#guest-name").fill("   ");
  await page.locator("#guest-submit").click();
  assert.equal(await page.evaluate(() => window.__guestCalls || 0), 0);
  await page.locator("#guest-name").fill("Testgäst");
  assert.equal(await page.locator("#guest-swish").getAttribute("required"), null);
  await page.locator("#guest-swish").fill("0700000003");
  await page.evaluate(() => { window.__guestError = "auth/admin-restricted-operation"; });
  await page.locator("#guest-submit").click();
  await page.waitForFunction(() => !document.getElementById("guest-submit").disabled);
  assert.match(await page.locator("#auth-error").innerText(), /inte aktiverad/);
  await page.screenshot({ path: new URL("../work/guest-join-test.png", import.meta.url).pathname });
  await page.evaluate(() => { window.__guestError = null; });
  await page.locator("#guest-submit").click();
  await page.locator('[data-claim-member="reserved-guest"]').click();
  await page.locator("#app").waitFor({ state: "visible" });
  const saved = await page.evaluate(() => window.__testDatabase());
  assert.equal(saved["users/guest-test"].name, "Testgäst");
  assert.equal(saved["users/guest-test"].guest, true);
  assert.equal(saved["users/guest-test"].swish, "46700000003");
  assert.equal(saved["bankbooks/guest-invite"].members["reserved-guest"].swish, "46700000003");
  assert.equal(saved["users/guest-test"].email, undefined);
  assert.deepEqual(saved["bankbooks/guest-invite"].memberIds, ["alice", "guest-test"]);
  assert.equal(saved["bankbooks/guest-invite"].members["reserved-guest"].claimedBy, "guest-test");
  await page.locator("#e-desc").fill("Gästköp");
  await page.locator("#e-amount").fill("100");
  await page.locator('#expense-form button[type="submit"]').click();
  await page.waitForFunction(() => document.getElementById("e-desc").value === "");
  assert.equal(await page.evaluate(() => Object.values(window.__testDatabase()).filter(e => e.desc === "Gästköp").length), 1);
  await page.reload();
  await page.getByRole("button", { name: /Testgästgrupp/ }).click();
  await page.locator("#app").waitFor({ state: "visible" });
  assert.match(await page.locator("#history-list").innerText(), /Gästköp/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("test-auth-user")).uid), "guest-test");
  assert.deepEqual(errors, []);
  console.log("Auth acceptance passed: delayed startup, reset validation, one request per click, neutral success, network/rate-limit errors, guest-disabled state, invitation, reserved profile, guest expense and persistent reload. No emails sent.");
} finally { releaseAuth(); await browser?.close(); await new Promise(resolve => server.close(resolve)); }
