import { open, go, bearer, API, CMS } from "../../../tools/session.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
export { open, go, bearer, API, CMS };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const KINDS = ["places", "pois", "routes", "guides", "events", "categories"];
export const settle = (page, ms = 1000) => page.waitForTimeout(ms);
mkdirSync("ux-audit/round-3/verify/v2-lists/shots", { recursive: true });
mkdirSync("ux-audit/round-3/verify/v2-lists/out", { recursive: true });
export const shot = (page, n, opts = {}) => page.screenshot({ path: `ux-audit/round-3/verify/v2-lists/shots/${n}.png`, ...opts }).catch((e) => console.log("shotfail", n, e.message));
export const save = (name, obj) => writeFileSync(`ux-audit/round-3/verify/v2-lists/out/${name}.json`, JSON.stringify(obj, null, 1));
export const focusDesc = (page) => page.evaluate(() => { const e = document.activeElement; const r = e.getBoundingClientRect(); return { tag: e.tagName, id: e.id, label: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 40), top: Math.round(r.top), inViewport: r.top >= 0 && r.bottom <= innerHeight }; });
export const ready = async (page) => {
  for (let a = 0; a < 3; a++) {
    await page.waitForSelector("[data-row-id], [role=alert], main h1, button:has-text('Sign in with UNICHE')", { timeout: 25000 }).catch(() => {});
    const si = page.getByRole("button", { name: /sign in with uniche/i });
    if (await si.count()) { const u = page.url(); await si.first().click(); await page.waitForLoadState("networkidle").catch(() => {}); if (page.url().includes("/realms/")) { await page.locator("#username").fill(process.env.U ?? ""); } await page.waitForTimeout(2000); continue; }
    await page.waitForSelector("[data-row-id], [role=alert], [data-empty], main h1", { timeout: 15000 }).catch(() => {});
    break;
  }
  await page.waitForTimeout(1500);
};
export const loadList = async (page, path, tries = 3) => { for (let i = 0; i < tries; i++) { await go(page, path); await ready(page); if (await page.locator("[data-row-id]").count()) return true; } return false; };
