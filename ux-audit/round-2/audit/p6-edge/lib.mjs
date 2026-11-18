import { open, go, VIEWPORTS, CMS, API } from "../../../tools/session.mjs";
export { open, go, VIEWPORTS, CMS, API };
import { readFileSync, appendFileSync } from "node:fs";
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const base = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
export const ids = () => JSON.parse(readFileSync(base + "ids.json", "utf8"));
export const shot = (page, name, vp = "1440", full = false) => page.screenshot({ path: `${base}shots/${name}__${vp}.png`, fullPage: full }).catch((e) => console.log("shotfail", e.message));
export const FILES = base + "files/";
export const log = (...a) => { console.log(...a); };
export const settle = async (page, ms = 1200) => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForFunction(() => !document.querySelector('[class*="animate-pulse"]'), null, { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(ms); };
export async function alerts(page) {
  return page.evaluate(() => [...document.querySelectorAll('[role=alert],[role=status],[aria-live],[data-sonner-toast]')].map((e) => `${e.getAttribute("role") || ""}/${e.getAttribute("aria-live") || ""}: ${(e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 400)}`).filter((s) => !/: $/.test(s)));
}
export async function focused(page) {
  return page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}#${a.id} name=${a.getAttribute("name") || ""} label=${(a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 70)} | inDialog=${!!a.closest("[role=dialog],[role=alertdialog]")}` : "none"; });
}
export const main = async (page, n = 600) => ((await page.locator("body").innerText()).replace(/\n+/g, " | ")).slice(0, n);
export function problem(status, code, extra = {}) {
  return { status, contentType: "application/problem+json", headers: { "x-request-id": "req-r2p6-" + status }, body: JSON.stringify({ type: "urn:uniche:iguide:problem:" + code.toLowerCase(), title: code, status, code, detail: "Forced by r2-p6 audit. rejected value was: SECRET-VALUE-123", requestId: "req-r2p6-" + status, ...extra }) };
}
export const AP = "**/iguide/api/v1/**";
