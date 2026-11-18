import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { CMS, VIEWPORTS } from "../../../tools/session.mjs";
export { CMS, VIEWPORTS };
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
export const { chromium } = require("@playwright/test");
export const SHOTS = join(here, "shots");
const creds = (a) => JSON.parse(readFileSync(join(here, "..", "..", "..", "tools", "accounts.local"), "utf8"))[a];
export async function fresh(vp = "1440", opts = {}) {
  const v = VIEWPORTS[vp];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.deviceScaleFactor ?? 1, ...opts });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
  return { browser, context, page };
}
export async function shot(page, name, vp, full = true) {
  const f = join(SHOTS, `${name}__${vp}.png`);
  await page.screenshot({ path: f, fullPage: full });
  return f;
}
/** UI sign-in; returns timeline of URLs. Screenshots before credentials are typed. */
export async function uiSignIn(page, account, vp, log = console.log) {
  const c = creds(account);
  const t0 = Date.now();
  page.on("framenavigated", (f) => { if (f === page.mainFrame()) log(`  nav +${Date.now() - t0}ms ${f.url().replace(/\?.*/, "?…")}`); });
  await page.goto(CMS + "/");
  await page.waitForLoadState("networkidle").catch(() => {});
  await shot(page, `signin__landing-${account}`, vp);
  const btn = page.getByRole("button", { name: /sign in/i });
  if (await btn.count()) { log("sign-in button: " + (await btn.first().textContent()).trim()); await btn.first().click(); }
  await page.waitForURL(/\/realms\//, { timeout: 30000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  await shot(page, `signin__idp-form-${account}`, vp);
  await page.locator("#username").fill(c.user);
  await page.locator("#password").fill(c.password);
  await page.locator("#kc-login").click();
  await page.waitForURL((u) => !u.toString().includes("/realms/"), { timeout: 30000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  log(`landed ${page.url()} after ${Date.now() - t0}ms`);
}
export const text = async (page, sel = "body") => (await page.locator(sel).first().innerText()).replace(/\n{3,}/g, "\n\n");
