import { open, go, shot, POP, VIEWPORTS } from "./lib.mjs";
import { chromium } from "./lib.mjs";
import { join, dirname } from "node:path"; import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const state = join(here, "..", "..", "..", "tools", ".auth", "curator.json");
const measure = async (page) => page.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0; };
  const sz = (e) => { const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; };
  const row = document.querySelector("tbody tr, [role=row]:not(:first-child)");
  const out = {};
  out.kebab = [...document.querySelectorAll("button[aria-label^='Actions for']")].filter(vis).slice(0, 2).map(sz);
  out.titleLink = [...document.querySelectorAll("tbody a, main a")].filter(vis).slice(0, 2).map(sz);
  out.handle = [...document.querySelectorAll("button[aria-label*='rag'],[class*=drag],button[aria-label*='eorder']")].filter(vis).slice(0, 2).map(sz);
  out.checkbox = [...document.querySelectorAll("main input[type=checkbox]")].filter(vis).slice(0, 3).map(sz);
  out.segments = [...document.querySelectorAll("main [role=radio], main [role=tab]")].filter(vis).slice(0, 4).map(sz);
  out.dots = [...document.querySelectorAll("tbody [class*=translation] a, tbody a[href*='lang']")].filter(vis).slice(0, 2).map(sz);
  const small = [...document.querySelectorAll("main button, main a, main input, main select, main [role=radio]")].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length;
  out.under44 = small; out.total = [...document.querySelectorAll("main button, main a, main input, main select")].filter(vis).length;
  return out;
});
for (const [label, touch, vp] of [["desktop1440", false, "1440"], ["touch1024", true, "1024"], ["touch768", true, "768"]]) {
  const browser = await chromium.launch({ headless: true });
  const v = VIEWPORTS[vp];
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, hasTouch: touch, isMobile: touch, storageState: state });
  const page = await ctx.newPage();
  for (const k of ["pois", "categories"]) {
    await go(page, `/projects/${POP}/${k}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900);
    console.log(label, k, JSON.stringify(await measure(page)), "pointer:", await page.evaluate(() => matchMedia("(pointer: coarse)").matches));
  }
  await shot(page, `categories-list__touch`, label);
  await browser.close();
}
