import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("1440"); const { page } = s;
await go(page, `${P}/maps/${ids.map}`); await page.waitForTimeout(5000);
// place 3 unplaced
for (let i=0;i<3;i++) { await page.locator("section:has(h2:has-text('Unplaced')) ul button", {hasText:"Place"}).first().click(); await page.waitForTimeout(500); }
await page.waitForTimeout(1500);
await s.shot("mapeditor__placed-3-toast");
await page.screenshot({ path: s.shot.length? undefined: undefined }).catch(()=>{});
await s.shot("mapeditor__placed-3-full", true);
// markers
const mk = await page.locator(".leaflet-marker-icon").evaluateAll(e=>e.map(x=>({tab:x.getAttribute("tabindex"),title:x.getAttribute("title"),alt:x.getAttribute("alt"),role:x.getAttribute("role"),w:x.getBoundingClientRect().width,x:Math.round(x.getBoundingClientRect().x),y:Math.round(x.getBoundingClientRect().y)})));
console.log(mk);
// all three at same spot (initial view)? 
// try keyboard on marker
const m0 = page.locator(".leaflet-marker-icon").first();
await m0.focus();
const before = await page.locator("section:has(h2:has-text('Placed')) ol li input").first().inputValue();
await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
await page.waitForTimeout(400);
const after = await page.locator("section:has(h2:has-text('Placed')) ol li input").first().inputValue();
console.log("lat before/after arrow on marker", before, after);
console.log("focus ring marker:", await m0.evaluate(e=>getComputedStyle(e).outlineStyle+" "+getComputedStyle(e).outlineWidth));
await s.shot("mapeditor__marker-focus");
// drag marker 1 with mouse
const box = await page.locator(".leaflet-marker-icon").first().boundingBox();
await page.mouse.move(box.x+13, box.y+13); await page.mouse.down(); await page.mouse.move(box.x+120, box.y-60, {steps:8}); await page.mouse.up();
await page.waitForTimeout(600);
console.log("after drag lat", await page.locator("section:has(h2:has-text('Placed')) ol li input").first().inputValue());
await s.shot("mapeditor__after-drag");
// type coordinates
const lat = page.locator("section:has(h2:has-text('Placed')) ol li input").nth(2);
await lat.fill("37.9745"); await page.locator("section:has(h2:has-text('Placed')) ol li input").nth(3).fill("23.7225");
await page.waitForTimeout(500);
// invalid coord
await page.locator("section:has(h2:has-text('Placed')) ol li input").nth(0).fill("abc");
await page.getByRole("button",{name:/^Save/}).first().click(); await page.waitForTimeout(1500);
await s.shot("mapeditor__invalid-coord-save", true);
console.log(await page.locator("[role=alert], [aria-live]").allInnerTexts());
await s.browser.close();
