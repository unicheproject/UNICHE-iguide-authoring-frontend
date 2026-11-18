import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const base = `/projects/${P}`;
const { browser, page } = await open("admin", { viewport: "1440" });
const out = {};
const screens = { places: `${base}/places`, maps: `${base}/maps`, media: `${base}/media`, dashboard: base, events: `${base}/events`, categories: `${base}/categories` };
const ed = await (async () => { await go(page, `${base}/pois`); await page.waitForTimeout(1500); return page.evaluate(() => [...document.querySelectorAll('a[href*="/pois/"]')].find((a) => /\/pois\/[0-9a-f-]{36}/.test(a.getAttribute("href")) && !/UX-/.test(a.textContent))?.getAttribute("href")); })();
screens.poiEditor = ed;
for (const [n, p] of Object.entries(screens)) {
  await go(page, p); await page.waitForTimeout(2200);
  await page.evaluate(() => document.activeElement?.blur()); await page.mouse.click(700, 4);
  const clipped = []; let ringless = [];
  for (let i = 0; i < 70; i++) {
    await page.keyboard.press("Tab"); await page.waitForTimeout(30);
    const r = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const rc = e.getBoundingClientRect(); let clip = null; for (let a = e.parentElement; a && a !== document.documentElement; a = a.parentElement) { const c = getComputedStyle(a); if (c.overflowX !== "visible" || c.overflowY !== "visible") { const ar = a.getBoundingClientRect(); const m = 4; const L = rc.left - m < ar.left - 0.5 && c.overflowX !== "visible", R = rc.right + m > ar.right + 0.5 && c.overflowX !== "visible", T = rc.top - m < ar.top - 0.5 && c.overflowY !== "visible", B = rc.bottom + m > ar.bottom + 0.5 && c.overflowY !== "visible"; if (L || R || T || B) { clip = { by: a.tagName + "." + (a.className + "").slice(0, 40), sides: [L && "L", R && "R", T && "T", B && "B"].filter(Boolean).join("") }; break; } } }
      return { tag: e.tagName.toLowerCase() + (e.getAttribute("role") ? "[" + e.getAttribute("role") + "]" : ""), name: (e.getAttribute("aria-label") || e.textContent || e.value || "").trim().slice(0, 24), outline: cs.outlineStyle, ow: cs.outlineWidth, inView: rc.top >= 0 && rc.bottom <= innerHeight, clip }; });
    if (!r) continue;
    if (r.clip && r.outline !== "none") clipped.push(r);
    if (r.outline === "none") ringless.push(r);
  }
  out[n] = { clipped, ringless };
}
writeFileSync("clip.json", JSON.stringify(out, null, 1)); await browser.close(); console.log("ok");
