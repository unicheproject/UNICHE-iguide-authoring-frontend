import { open, go, CMS, API } from "../../../../tools/session.mjs";
import { appendFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
export { open, go, CMS, API };
export const here = dirname(fileURLToPath(import.meta.url));
export const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const P = (p) => `/projects/${PID}${p}`;
export const ids = JSON.parse(readFileSync(join(here, "ids.json"), "utf8"));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const AFTER = join(here, "..", "after");
mkdirSync(AFTER, { recursive: true });
export const LOG = (name) => (...a) => { const s = a.map((x) => typeof x === "string" ? x : JSON.stringify(x)).join(" "); console.log(s); appendFileSync(join(here, "logs-" + name + ".txt"), s + "\n"); };
export const shot = (page, name) => page.screenshot({ path: join(AFTER, name + ".png") }).catch((e) => console.log("shot fail", name, e.message));
export async function session(opts = {}) {
  return await open("admin", opts);
}
export const AE = (page) => page.evaluate(() => { const a = document.activeElement; if (!a) return null; return (a.tagName.toLowerCase() + (a.id ? "#" + a.id : "") + (a.getAttribute("role") ? "[" + a.getAttribute("role") + "]" : "") + ' "' + (a.getAttribute("aria-label") || a.textContent || a.value || "").trim().slice(0, 50) + '"'); });
/** Height of everything stuck to the top of the viewport after scrolling down. */
export const stickyStack = async (page) => {
  await page.evaluate(() => { const m = document.getElementById("main"); (m && m.scrollHeight > m.clientHeight ? m : document.scrollingElement).scrollTo(0, 500); });
  await sleep(300);
  return page.evaluate(() => {
    const vw = innerWidth, out = []; const app = Math.round(document.querySelector('header')?.getBoundingClientRect().bottom ?? 0);
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el); if (cs.position !== "sticky" && cs.position !== "fixed") continue;
      const r = el.getBoundingClientRect(); if (r.height < 4 || r.width < vw * 0.4 || r.top > app + 4 || r.bottom <= 0) continue;
      out.push({ el: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 2).join(".") : ""), top: Math.round(r.top), h: Math.round(r.height), bottom: Math.round(r.bottom) });
    }
    const bottom = Math.max(app, ...out.map((o) => o.bottom)); return { vh: innerHeight, app, chrome: bottom, pct: +(bottom / innerHeight * 100).toFixed(1), parts: out };
  });
};
export const names = (page) => page.evaluate(() => [...document.querySelectorAll("button, [role=button], a")].filter((b) => b.getClientRects().length).map((b) => (b.getAttribute("aria-label") || b.textContent || "").trim().replace(/\s+/g, " ")).filter(Boolean));
