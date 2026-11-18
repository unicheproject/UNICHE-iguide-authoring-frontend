import { open, go, VIEWPORTS, CMS, API, bearer } from "../../../tools/session.mjs";
export { open, go, VIEWPORTS, CMS, API, bearer };
export const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const SH = new URL("./shots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
export const shot = (page, name, vp = "1440", full = true) => page.screenshot({ path: `${SH}${name}__${vp}.png`, fullPage: full });
export async function settle(page, ms = 2500) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForFunction(() => !document.querySelector('[class*="animate-pulse"],[class*="skeleton"]'), null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(ms > 1000 ? 600 : ms);
}
export const fs = await import("node:fs");
export const log = (name, v) => fs.appendFileSync(new URL("./log.txt", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"), `## ${name}\n${typeof v === "string" ? v : JSON.stringify(v, null, 1)}\n\n`);
export async function listReady(page) {
  await page.waitForFunction(() => /Search in|Sort by/.test(document.querySelector("main")?.innerText ?? "") && /\bNot archived\s*\n?\s*\d+/.test(document.querySelector("main")?.innerText ?? "") && !/Not archived\s*0\s*Active\s*0/.test((document.querySelector("main")?.innerText ?? "").replace(/\s+/g," ")), null, { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(700);
}
