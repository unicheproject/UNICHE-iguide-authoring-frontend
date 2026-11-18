import { open, CMS, P, settle, here } from "./lib.mjs";
import { join } from "node:path";
const base = `${CMS}/projects/${P}`;
for (const vp of ["1440", "1280"]) {
const { browser, page } = await open("admin", { viewport: vp });
await page.goto(`${base}/pois`); await settle(page, 1200);
await page.goto(`${base}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await settle(page, 1500);
await page.getByRole("button", { name: /Copy link/ }).first().click();
await page.waitForTimeout(1000);
const g = await page.evaluate(() => {
  const R = (el) => el ? (({ x, y, width, height, right, bottom }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height), right: Math.round(right), bottom: Math.round(bottom) }))(el.getBoundingClientRect()) : null;
  const t = [...document.querySelectorAll("*")].find((e) => e.children.length === 0 && /^(Link copied|The link was not copied)$/.test(e.textContent.trim()));
  let card = t; for (let i = 0; i < 4 && card; i++) { if (getComputedStyle(card).position === "fixed") break; card = card.parentElement; }
  const toastStack = document.querySelector("[style*='--toast-inset-right']");
  const aside = document.querySelector("aside"); const col = document.querySelector("main input")?.closest("section");
  return { found: !!t, stack: R(toastStack), aside: R(aside), formCard: R(col), vw: innerWidth, insetVar: getComputedStyle(document.documentElement).getPropertyValue("--toast-inset-right") };
});
console.log(vp, JSON.stringify(g));
await page.screenshot({ path: join(here, "shots", `${vp}-toast-save-first.png`) });
await browser.close();
}
