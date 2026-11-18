import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
export { open, go, bearer, CMS, API, VIEWPORTS } from "../../../tools/session.mjs";
const here = dirname(fileURLToPath(import.meta.url));
export const seed = JSON.parse(readFileSync(join(here, "../../../tools/seed.json"), "utf8"));
export const P = seed.projects.populated.id;
export const shots = join(here, "shots") + "/";
export const shot = async (page, name, full = true) => { await page.screenshot({ path: shots + name + ".png", fullPage: full }).catch((e) => console.log("shotfail", name, e.message)); };
export const settle = async (page, ms = 1500) => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(ms); };
/** list interactive elements smaller than 44x44 */
export const targets = (page, min = 44) => page.evaluate((min) => {
  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=menuitem],[role=checkbox],[role=radio],[role=switch],summary,[tabindex]:not([tabindex="-1"])';
  const out = []; let total = 0;
  for (const e of document.querySelectorAll(sel)) {
    if (e.closest("[inert]")) continue;
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    if (!r.width || !r.height || cs.visibility === "hidden" || cs.display === "none") continue;
    if (e.matches("input[type=checkbox],input[type=radio]") && e.closest("label")) { const lr = e.closest("label").getBoundingClientRect(); if (lr.height >= min && lr.width >= min) { total++; continue; } }
    total++;
    if (r.width < min || r.height < min) out.push({ t: e.tagName.toLowerCase(), n: (e.getAttribute("aria-label") || e.textContent || e.getAttribute("name") || e.id || "").trim().replace(/\s+/g, " ").slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
  }
  return { total, small: out };
}, min);
export const report = (label, r) => { console.log(`## ${label}: ${r.small.length}/${r.total} under 44`); const g = {}; for (const s of r.small) { const k = `${s.t}|${s.n}|${s.w}x${s.h}`; g[k] = (g[k] || 0) + 1; } for (const [k, v] of Object.entries(g).slice(0, 40)) console.log("   ", v, k); };
export const POI = "b7fa9ab8-402a-405f-bfaa-8aa0776efed2";
