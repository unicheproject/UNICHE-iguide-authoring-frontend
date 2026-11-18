import { start, goEd, P, tall, place, poi } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const dlg = async (name) => { await page.waitForTimeout(1200); const d = page.getByRole("dialog"); console.log(name, "dialog count", await d.count()); if (await d.count()) { console.log((await d.first().innerText()).replace(/\n+/g," | ")); await s.shot(name); } };
// pre-existing in-use Place: Acropolis site -> Deactivate then cancel with Esc
await goEd(page, "/places/"+place("site").id);
await page.getByRole("button", { name: /^deactivate$/i }).first().click(); await dlg("deactivate-inuse-place");
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("focus after esc:", await page.evaluate(()=>document.activeElement?.textContent?.trim().slice(0,30)));
await page.getByRole("button", { name: /^archive$/i }).first().click(); await dlg("archive-inuse-place");
await page.keyboard.press("Escape");
// my place
await goEd(page, "/places/e2429d5c-31f0-44c0-96d6-eadbacdaaca5");
await page.getByRole("button", { name: /^archive$/i }).first().click(); await dlg("archive-own-place");
await page.keyboard.press("Escape");
await page.getByRole("button", { name: /^deactivate$/i }).first().click(); await dlg("deactivate-own-place");
await page.keyboard.press("Escape");
// POI with where-used
await goEd(page, "/pois/"+poi("pediment").id);
await page.getByRole("button", { name: /^deactivate$/i }).first().click(); await dlg("deactivate-inuse-poi");
await page.keyboard.press("Escape");
await page.getByRole("button", { name: /^archive$/i }).first().click(); await dlg("archive-inuse-poi");
await page.keyboard.press("Escape");
await s.browser.close();
