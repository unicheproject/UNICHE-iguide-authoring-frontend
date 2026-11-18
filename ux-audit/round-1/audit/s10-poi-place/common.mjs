import { open, go, CMS, API } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
export const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url)));
export const PID = seed.projects.populated.id;
export const P = `/projects/${PID}`;
export const shotDir = new URL("./shots/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
export const poi = (k) => seed.pois.find(p => p.key === k);
export const place = (k) => seed.places.find(p => p.key === k);
export async function start(viewport = "1440") {
  const s = await open("curator", { viewport });
  s.page.on("pageerror", e => console.log("PAGEERROR", e.message));
  s.shot = (name, full = false) => s.page.screenshot({ path: shotDir + name + `__${viewport}.png`, fullPage: full });
  s.vp = viewport;
  return s;
}
export async function goEd(page, path) {
  await go(page, P + path);
  await page.locator("main h1").first().waitFor({ timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1200);
}
export { go, CMS, API };
/** Screenshot of the whole scrolling <main> by growing the viewport to its content height. */
export async function tall(s, name) {
  const { page } = s;
  const h = await page.evaluate(() => { const m = document.querySelector("main"); return m.scrollHeight + m.getBoundingClientRect().top; });
  const vp = page.viewportSize();
  await page.setViewportSize({ width: vp.width, height: Math.min(Math.ceil(h) + 4, 6000) });
  await page.waitForTimeout(400);
  await page.screenshot({ path: shotDir + name + `__${s.vp}__tall.png` });
  await page.setViewportSize(vp);
  return h;
}
export const MINE = { place: "e2429d5c-31f0-44c0-96d6-eadbacdaaca5", poi1: "109e19ff-9fed-42e7-ae18-2884419f6c2e", poi2: "7b3cf597-5594-4a6d-8300-65b298d09324" };
