import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { appendFileSync } from "node:fs";
import { open, go, VIEWPORTS } from "../../../../tools/session.mjs";
export { open, go, VIEWPORTS };
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "..", "package.json"));
export const { AxeBuilder } = require("@axe-core/playwright");
export const POP = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const MAP = "b2ab454f-2c60-44b2-888c-979ec19e0393";
export const PLAN = "375edf44-fff5-4ad8-9660-76913a5f74b1";
export const AFTER = join(here, "..", "after");
export const shot = (page, name, vp, full = false) => page.screenshot({ path: join(AFTER, `${name}__${vp}.png`), fullPage: full });
export const log = (...a) => { const s = a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "); console.log(s); appendFileSync(join(here, "out.log"), s + "\n"); };
export const run = async (fn) => { try { await fn(); } catch (e) { console.log("FAIL", e.message.slice(0, 600)); process.exitCode = 1; } };
export async function start(vp, opts = {}) {
  const r = await open("admin", { viewport: vp, ...opts });
  r.page.setDefaultTimeout(8000);
  r.page.on("pageerror", (e) => log("PAGEERROR", e.message.slice(0, 200)));
  return r;
}
export async function axe(page, label) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  log("AXE", label, r.violations.map((v) => `${v.id}(${v.impact}) x${v.nodes.length}`).join("; ") || "clean");
}
export const box = (sel) => `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right), b: Math.round(b.bottom) }; })()`;
export const focusDesc = (page) => page.evaluate(() => { const e = document.activeElement; return e ? `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""} role=${e.getAttribute("role")} "${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 50)}"` : "none"; });
