import { open, go, VIEWPORTS, CMS, API } from "../../../tools/session.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
export { go, VIEWPORTS, CMS, API };
export const here = dirname(fileURLToPath(import.meta.url));
export const PID = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const P = `/projects/${PID}`;
const page_vp = (vp) => VIEWPORTS[vp];
export const log = console.log;
export async function start(vp = "1440", opts = {}) {
  const s = await open("curator", { viewport: vp, ...opts });
  s.page.on("pageerror", e => log("PAGEERROR", e.message));
  s.vp = vp;
  s.tall = async (name, h = 3200) => { const v = page_vp(vp); await s.page.setViewportSize({ width: v.width, height: h }); await s.page.waitForTimeout(400); await s.page.screenshot({ path: join(here, "shots", `${name}__${vp}.png`) }); await s.page.setViewportSize({ width: v.width, height: v.height }); await s.page.waitForTimeout(200); };
  s.shot = (name, full = false) => s.page.screenshot({ path: join(here, "shots", `${name}__${vp}.png`), fullPage: full });
  return s;
}
export async function goP(page, path) {
  await go(page, P + path);
  await page.locator("main h1, h1").first().waitFor({ timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
}
export async function focused(page) {
  return page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()}#${a.id} [${(a.getAttribute("aria-label") || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50)}]` : "none"; });
}
export const state = () => existsSync(join(here, "state.json")) ? JSON.parse(readFileSync(join(here, "state.json"), "utf8")) : {};
export const save = (o) => writeFileSync(join(here, "state.json"), JSON.stringify({ ...state(), ...o }, null, 1));
export async function dump(page, sel = "main") {
  return page.evaluate((sel) => document.querySelector(sel)?.innerText ?? "", sel);
}
