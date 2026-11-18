import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { open, CMS } from "../../../tools/session.mjs";
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
const { AxeBuilder } = require("@axe-core/playwright");
export { open, CMS, here };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const EC = "ceee1b24-e7c4-474e-93ba-f77067ed8a72";
export const EB = "1d6971ce-6391-4da8-848e-8d7466d25128";
mkdirSync(join(here, "shots"), { recursive: true });
export const results = [];
export function attach(page, tag) {
  const errs = { tag, pageerror: [], console: [] };
  page.on("pageerror", (e) => errs.pageerror.push(String(e.message).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") errs.console.push(m.text().slice(0, 300)); });
  return errs;
}
export async function settle(page, ms = 1200) {
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(ms);
}
export async function axe(page) {
  try {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes[0]?.target?.join(" ").slice(0, 120) }));
  } catch (e) { return [{ id: "AXE-ERROR", impact: "error", n: 0, help: String(e.message).slice(0, 200) }]; }
}
/** record: axe + screenshot + overlay check */
export async function rec(page, name, { shot = true, full = true, vp = "1440", axeOn = true } = {}) {
  await settle(page, 400);
  const overlay = await page.locator("vite-error-overlay").count().catch(() => 0);
  const h1 = await page.locator("h1").first().textContent({ timeout: 500 }).catch(() => null);
  const bodyLen = await page.evaluate(() => document.body.innerText.length).catch(() => -1);
  const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1).catch(() => null);
  const v = axeOn ? await axe(page) : [];
  const file = `shots/${vp}-${name}.png`;
  if (shot) await page.screenshot({ path: join(here, file), fullPage: full }).catch(async () => { await page.screenshot({ path: join(here, file) }).catch(() => {}); });
  const row = { name, vp, url: page.url().replace(CMS, ""), title: await page.title(), h1: h1?.trim(), overlay, bodyLen, hscroll, violations: v };
  results.push(row);
  appendFileSync(join(here, "results.ndjson"), JSON.stringify(row) + "\n");
  return row;
}
export async function tryDo(label, fn) { try { return await fn(); } catch (e) { appendFileSync(join(here, "notes.txt"), `${label}: ${String(e.message).split("\n")[0]}\n`); return null; } }
