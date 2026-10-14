import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";

const base = new URL("../public/bankboken-multi/", import.meta.url);

test("app module and every relative static import exist and parse", async () => {
  const visited = new Set();
  async function visit(url) {
    if (visited.has(url.href)) return;
    visited.add(url.href);
    const source = await readFile(url, "utf8");
    const parsed = spawnSync(process.execPath, ["--check", url.pathname], { encoding: "utf8" });
    assert.equal(parsed.status, 0, parsed.stderr);
    for (const match of source.matchAll(/from\s+["'](\.\.?\/[^"']+)["']/g)) await visit(new URL(match[1], url));
  }
  await visit(new URL("app.js", base));
  assert.ok(visited.has(new URL("finance.js", base).href));
  assert.ok(!visited.has(new URL("credit-card-model.js", base).href), "Foundation must not enable unfinished credit card features");
});

test("existing group page has all literal DOM IDs referenced by the app", async () => {
  const html = await readFile(new URL("index.html", base), "utf8");
  const source = await readFile(new URL("app.js", base), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
  const missing = [...source.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map(m => m[1]).filter(id => !ids.includes(id));
  assert.deepEqual([...new Set(missing)], []);
  assert.match(html, /type="module"\s+src="app\.js/);
  for (const match of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)) {
    const path = match[1];
    if (/^(https?:|data:|#|\/)/.test(path)) continue;
    await readFile(new URL(path, base));
  }
});
