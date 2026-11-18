import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const base = `/projects/${P}`;
export const SH = "ux-audit/round-3/audit/p3-translator/shots/";
export { open, go };
export async function shot(page, name, full = false) { await page.screenshot({ path: SH + name + ".png", fullPage: full }); }
export async function dump(page) {
  return page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    return [...document.querySelectorAll("button,a[href],input,select,textarea,[role=tab],[role=combobox]")].filter(vis).slice(0, 120).map((e) => `${e.tagName.toLowerCase()}${e.getAttribute("role") ? "[" + e.getAttribute("role") + "]" : ""} | ${(e.getAttribute("aria-label") || e.innerText || e.placeholder || e.value || "").trim().replace(/\s+/g, " ").slice(0, 70)} | ${e.getAttribute("href") || ""}`);
  });
}
