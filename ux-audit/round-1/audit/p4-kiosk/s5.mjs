import { open, go, P, shot, small } from "./lib.mjs";
const log = (...a) => console.log(...a);
const { browser, context, page } = await open("curator", { viewport: "1024", touch: true });
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1200);
await page.getByRole("button", { name: /New point of interest/i }).tap(); await page.waitForTimeout(600);
await shot(page, "dialog-new-poi__1024");
const dlg = page.getByRole("dialog");
log("dialog box", JSON.stringify(await dlg.boundingBox()), "small", JSON.stringify(await small(page, "[role=dialog]")));
log("dlg fields", await dlg.locator("input,select,textarea").evaluateAll(a=>a.map(i=>[i.tagName,i.name||i.id,i.type])));
// empty submit
await dlg.getByRole("button", { name: /create/i }).tap(); await page.waitForTimeout(500); await shot(page, "dialog-new-poi__empty-submit__1024");
await dlg.locator("input").first().fill("UX-p4-kiosk POI one");
await shot(page, "dialog-new-poi__filled__1024");
await dlg.getByRole("button", { name: /create/i }).tap(); await page.waitForTimeout(2500);
log("url", page.url());
await shot(page, "poi-own__created__1024", true);
// find map section
const map = page.locator(".leaflet-container").first();
await map.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
await shot(page, "poi-own__map__1024");
log("map box", JSON.stringify(await map.boundingBox()));
log("map ctrl", await page.locator("main").getByRole("button").allTextContents().then(a=>a.map(s=>s.trim()).filter(Boolean).join(" | ")));
await browser.close();
