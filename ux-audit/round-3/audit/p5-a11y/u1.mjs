import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("u1");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
const seed = JSON.parse(readFileSync(H.here + "/../../../tools/seed.json", "utf8"));
{
  const { browser, page } = await H.session();
  try {
    await H.go(page, H.P("/pois/" + ids.poi)); await H.sleep(900);
    await page.getByLabel("Title", { exact: false }).first().focus(); await page.keyboard.type("?");
    await page.getByRole("button", { name: /Switch project/ }).focus(); await page.keyboard.press("Enter"); await H.sleep(500);
    await page.keyboard.type("UX Audit – Empty B"); await H.sleep(500); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await H.sleep(900);
    await page.keyboard.press("Escape"); await H.sleep(900);
    await H.shot(page, "leave-confirm__after-esc__1440");
    log("after cancel: title", await page.title(), "| switcher label:", await page.getByRole("button", { name: /Switch project/ }).evaluate(e => e.getAttribute("aria-label")), "| live", JSON.stringify(await H.live(page)));
  } finally { await browser.close(); }
}
{
  const { browser, page } = await H.session({ forcedColors: "active" });
  try {
    await H.go(page, H.P("/pois")); await H.sleep(900);
    await page.getByRole("button", { name: /^Actions for/ }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(400);
    log("FC menu items", await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].map(i => { const cs = getComputedStyle(i); return i.textContent.trim().slice(0, 14) + " foc=" + (document.activeElement === i) + " hl=" + i.hasAttribute("data-highlighted") + " outline=" + cs.outlineStyle + " border=" + cs.borderTopWidth + "/" + cs.borderTopColor + " bg=" + cs.backgroundColor + " col=" + cs.color; })));
    await page.keyboard.press("ArrowDown"); await H.sleep(150);
    log("FC after ArrowDown", await page.evaluate(() => [...document.querySelectorAll("[role=menuitem]")].slice(0, 4).map(i => { const cs = getComputedStyle(i); return i.textContent.trim().slice(0, 14) + " foc=" + (document.activeElement === i) + " bg=" + cs.backgroundColor + " outline=" + cs.outlineStyle + cs.outlineWidth; })));
  } finally { await browser.close(); }
}
{
  const { browser, page } = await H.session();
  try {
    await H.go(page, H.P("/floor-plans/" + seed.floorPlans[0].id)); await H.sleep(1500);
    log("floorplan Place buttons", await page.evaluate(() => { const b = [...document.querySelectorAll("button")].filter(x => /^Place/.test(x.textContent.trim()) || /^Place /.test(x.getAttribute("aria-label") || "")); return { n: b.length, sample: b.slice(0, 3).map(x => x.getAttribute("aria-label") || x.textContent.trim()) }; }));
    await page.evaluate(() => document.querySelector("h1").focus());
    const lines = await H.sweep(page, 60, "floorplan", log); log("floorplan stops", lines.length);
    await H.go(page, H.P("/maps/" + seed.maps[0].id)); await H.sleep(1500);
    await page.evaluate(() => document.querySelector("h1").focus());
    const l2 = await H.sweep(page, 80, "map-editor", log); log("map-editor stops", l2.length);
    await H.shot(page, "map-editor__top__1440");
  } finally { await browser.close(); }
}
