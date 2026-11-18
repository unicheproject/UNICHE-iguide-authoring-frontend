import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("1440"); const { page } = s;
await page.route(/openfreemap\.org|tile\.openstreetmap\.org/, r => r.abort());
await go(page, `${P}/maps/${ids.map}`); await page.waitForTimeout(6000);
await page.locator(".leaflet-container").scrollIntoViewIfNeeded();
await s.shot("mapeditor__tiles-blocked");
console.log("alerts:", await page.locator("[role=alert],[role=status]").allInnerTexts());
console.log("markers:", await page.locator(".leaflet-marker-icon").count());
await s.browser.close();
// slow tiles
const s2 = await start("1440"); const p2 = s2.page;
await p2.route(/openfreemap\.org/, async r => { await new Promise(x=>setTimeout(x,8000)); r.continue(); });
await go(p2, `${P}/maps/${ids.map}`); await p2.waitForTimeout(3000);
await p2.locator(".leaflet-container").scrollIntoViewIfNeeded();
await s2.shot("mapeditor__tiles-slow");
await s2.browser.close();
// api 503 for the map
const s3 = await start("1440"); const p3 = s3.page;
await p3.route(new RegExp(`/maps/${ids.map}$`), r => r.fulfill({status:503, contentType:"application/problem+json", body: JSON.stringify({status:503,title:"x",code:"UNAVAILABLE",requestId:"r-1"})}));
await go(p3, `${P}/maps/${ids.map}`); await p3.waitForTimeout(3000);
await s3.shot("mapeditor__503");
await s3.browser.close();
const s4 = await start("1440"); const p4 = s4.page;
await p4.route(new RegExp(`/maps/${ids.map}$`), r => r.fulfill({status:404, contentType:"application/problem+json", body: JSON.stringify({status:404,title:"x",code:"NOT_FOUND",requestId:"r-2"})}));
await go(p4, `${P}/maps/${ids.map}`); await p4.waitForTimeout(3000);
await s4.shot("mapeditor__404");
await s4.browser.close();
