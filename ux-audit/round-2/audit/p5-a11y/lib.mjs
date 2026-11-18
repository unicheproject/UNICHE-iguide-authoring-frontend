import { open, go, VIEWPORTS, CMS, API, bearer } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
import { writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
export const { AxeBuilder } = require("@axe-core/playwright");
export { open, go, VIEWPORTS, CMS, API, bearer };
export const POP = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const P = (p) => `/projects/${POP}${p}`;
export const shotDir = join(here, "shots");
export const log = (name, ...a) => { const s = a.map((x) => typeof x === "string" ? x : JSON.stringify(x)).join(" "); console.log(s); appendFileSync(join(here, "logs", name + ".log"), s + "\n"); };
export async function shot(page, name, full = false) { await page.screenshot({ path: join(shotDir, name + ".png"), fullPage: full }); }
/** Describes the focused element. */
export async function focus(page) {
  return page.evaluate(() => {
    const e = document.activeElement; if (!e) return "none";
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    const name = e.getAttribute("aria-label") || (e.labels && e.labels[0]?.textContent) || e.textContent || e.getAttribute("placeholder") || e.getAttribute("title") || "";
    const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 ? `outline ${cs.outlineWidth} ${cs.outlineColor}` : (cs.boxShadow !== "none" ? "shadow" : "NO-RING");
    const inView = r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    return `${e.tagName.toLowerCase()}${e.getAttribute("role") ? "[" + e.getAttribute("role") + "]" : ""} "${name.trim().replace(/\s+/g, " ").slice(0, 60)}" ${ring} ${inView ? "visible" : "OFFSCREEN"} y=${Math.round(r.top)}`;
  });
}
export async function press(page, key, n = 1) { for (let i = 0; i < n; i++) await page.keyboard.press(key); }
/** Tab through N stops, returning the focus log. */
export async function tabs(page, n, shift = false) { const out = []; for (let i = 0; i < n; i++) { await page.keyboard.press(shift ? "Shift+Tab" : "Tab"); out.push(await focus(page)); } return out; }
export async function live(page) { return page.evaluate(() => [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log]')].map((e) => `${e.getAttribute("role") || ""}/${e.getAttribute("aria-live") || ""}: ${(e.textContent || "").trim().slice(0, 140)}`)); }
/** Installs a mutation observer recording every live-region text change. */
export async function watchLive(page) {
  await page.evaluate(() => { window.__live = []; const seen = new WeakMap();
    const tick = () => document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log]').forEach((e) => { const t = (e.textContent || "").trim(); if (t && seen.get(e) !== t) { seen.set(e, t); window.__live.push(`${e.getAttribute("role") || ""}/${e.getAttribute("aria-live") || ""}: ${t.slice(0, 160)}`); } });
    new MutationObserver(tick).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true }); tick(); });
}
export async function liveLog(page) { return page.evaluate(() => window.__live ?? []); }
export async function axe(page, label, tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]) {
  const r = await new AxeBuilder({ page }).withTags(tags).analyze();
  const rows = r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.target?.join(" ").slice(0, 90), help: v.help.slice(0, 70) }));
  log("axe", label, JSON.stringify(rows));
  return rows;
}
export async function snap(page, name, selector = "body") {
  const s = await page.locator(selector).first().ariaSnapshot();
  writeFileSync(join(here, "logs", `aria__${name}.txt`), s);
  return s;
}
export async function title(page) { return page.title(); }
/** go + wait until the route is titled, an h1 exists, and no loading status/skeleton remains. */
export async function nav(page, path, extra = 600) {
  await go(page, path);
  await page.waitForFunction(() => document.title.includes("·") && document.querySelector("main h1") && !document.querySelector('[aria-busy="true"]') && ![...document.querySelectorAll('[role=status]')].some((e) => /loading/i.test(e.textContent || "")), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(extra);
}
