import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { VIEWPORTS, CMS } from "../../../tools/session.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
export const { chromium } = require("@playwright/test");
export const { AxeBuilder } = require("@axe-core/playwright");
export { VIEWPORTS, CMS };
export const SHOTS = join(here, "shots");
const creds = () => JSON.parse(readFileSync(join(here, "..", "..", "..", "tools", "accounts.local"), "utf8")).admin;
export async function fresh(vp = "1440", opts = {}) {
  const v = VIEWPORTS[vp];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.deviceScaleFactor ?? 1, reducedMotion: opts.reducedMotion ?? "no-preference", forcedColors: opts.forcedColors ?? "none" });
  const page = await context.newPage();
  return { browser, context, page };
}
export async function kcLogin(page) {
  const c = creds();
  await page.waitForURL(/\/realms\//, { timeout: 30000 });
  await page.locator("#username").fill(c.user);
  await page.locator("#password").fill(c.password);
  await page.locator("#kc-login").click();
}
export const shot = (page, name, full = false) => page.screenshot({ path: join(SHOTS, name + ".png"), fullPage: full });
export const text = (page) => page.evaluate(() => document.body.innerText);
