// Probe A9: fresh Keycloak sign-in; hash and history length after landing.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { chromium } = require("@playwright/test");
const creds = JSON.parse(readFileSync("ux-audit/tools/accounts.local", "utf8")).admin;
const browser = await chromium.launch();
const page = await (await browser.newContext()).newPage();
const urls = [];
page.on("framenavigated", (f) => { if (f === page.mainFrame()) urls.push(f.url().replace(/(code|state|session_state|iss)=[^&]+/g, "$1=…")); });
await page.goto("http://localhost:5173/");
await page.waitForLoadState("networkidle").catch(() => {});
await page.getByRole("button", { name: /sign in/i }).first().click();
await page.waitForURL(/\/realms\//);
const before = await page.evaluate(() => history.length);
await page.locator("#username").fill(creds.user);
await page.locator("#password").fill(creds.password);
await page.locator("#kc-login").click();
await page.waitForURL((u) => !u.toString().includes("/realms/"));
const t0 = Date.now();
const samples = [];
for (let i = 0; i < 8; i++) { samples.push({ ms: Date.now() - t0, hash: await page.evaluate(() => location.hash.slice(0, 20)), search: await page.evaluate(() => location.search.slice(0, 30)) }); await page.waitForTimeout(100); }
await page.waitForLoadState("networkidle").catch(() => {});
console.log(JSON.stringify({ samples, finalUrl: page.url().replace(/(code|state|session_state|iss)=[^&]+/g, "$1=…"), historyLenBefore: before, historyLenAfter: await page.evaluate(() => history.length), urls }, null, 1));
await browser.close();
