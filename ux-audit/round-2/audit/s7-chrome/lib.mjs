import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { open, go, CMS, API, VIEWPORTS } from "../../../tools/session.mjs";
export { open, go, CMS, API, VIEWPORTS };
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
export const { chromium } = require("@playwright/test");
export const { AxeBuilder } = require("@axe-core/playwright");
export const SHOTS = join(here, "shots");
export const POP = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const EMPTY_D = "f56e8c75-94af-4c87-88c8-06cba46240a1";
export const EMPTY_B = "1d6971ce-6391-4da8-848e-8d7466d25128";
export const creds = (a) => JSON.parse(readFileSync(join(here, "..", "..", "..", "tools", "accounts.local"), "utf8"))[a];
export async function shot(page, name, vp, full = false) {
  await page.screenshot({ path: join(SHOTS, `${name}__${vp}.png`), fullPage: full });
}
export async function freshCtx(vp = "1440", opts = {}) {
  const v = VIEWPORTS[vp];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.deviceScaleFactor ?? 1, ...opts });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
  return { browser, context, page };
}
export async function axe(page, label) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  console.log("AXE", label, r.violations.map((v) => `${v.id}(${v.impact}) x${v.nodes.length}`).join("; ") || "clean");
  return r;
}
export const t = async (page, sel = "body") => (await page.locator(sel).first().innerText()).replace(/\n{3,}/g, "\n\n");
export const run = async (fn) => { try { await fn(); } catch (e) { console.log("FAIL", e.message.slice(0, 500)); process.exitCode = 1; } };
export const AP = /localhost:8080\/iguide\/api\/v1\//;
export const problem = (status, code, extra = {}) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: code, status, code, detail: "Server detail text.", requestId: "req-R2-s7-0001", ...extra }) });
export const focusDesc = (page) => page.evaluate(() => { const e = document.activeElement; return e ? `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""} "${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 50)}"` : "none"; });
