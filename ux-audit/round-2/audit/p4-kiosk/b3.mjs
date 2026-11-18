import { open, go, P, POI, shot, settle, targets, report } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1024", touch: true });
const errs=[]; page.on("pageerror", e=>errs.push(e.message));
await go(page, `/projects/${P}/pois/${POI}`); await settle(page, 2500);
console.log("sections:", await page.locator("section h2, section h3").allTextContents());
// triggers present?
console.log("trigger rows saved?", await page.getByText(/Beacons work in the mobile app only/).count());
const place = page.locator("section", { hasText: "Placement" }).first();
await place.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
await shot(page, "poi-placement__empty__1024", false);
console.log("placement text:", (await place.innerText()).replace(/\n/g," | ").slice(0,700));
const map = place.locator(".leaflet-container").first();
const mb = await map.boundingBox(); console.log("map box", JSON.stringify(mb));
await map.scrollIntoViewIfNeeded(); const mb2 = await map.boundingBox();
await page.touchscreen.tap(mb2.x + mb2.width/2, mb2.y + mb2.height/2); await page.waitForTimeout(1200);
console.log("lat/lon after tap:", await place.getByLabel(/Latitude/).inputValue().catch(()=>"?"), await place.getByLabel(/Longitude/).inputValue().catch(()=>"?"));
await shot(page, "poi-placement__tapped__1024", false);
console.log("leaflet controls", await map.locator(".leaflet-control-zoom a, .leaflet-marker-icon").evaluateAll(a=>a.map(x=>x.className.toString().slice(0,30)+" "+Math.round(x.getBoundingClientRect().width)+"x"+Math.round(x.getBoundingClientRect().height))));
// swipe inside map: does page scroll or map pan
const before = await page.evaluate(()=>document.querySelector("main")?.scrollTop ?? window.scrollY);
await page.touchscreen.tap(mb2.x+20, mb2.y+20);
console.log("hint text", await place.getByText(/Click|Tap/).allTextContents());
await browser.close();
