import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("1440"); const { page } = s;
await go(page, `${P}/maps/${ids.map}`); await page.waitForTimeout(5000);
// bounds by fields
const set = async (l,v)=>{ await page.getByLabel(l,{exact:true}).fill(v); };
await set("Min latitude","37.966"); await set("Max latitude","37.976"); await set("Min longitude","23.718"); await set("Max longitude","23.734");
await page.waitForTimeout(1500);
console.log("view after bounds typed:", await page.evaluate(()=>[...document.querySelectorAll("label")].filter(l=>/Latitude|Longitude|Zoom/.test(l.textContent)).slice(0,3).map(l=>l.textContent.trim()+"="+l.querySelector("input")?.value)));
await s.shot("mapeditor__bounds-typed");
// set initial view to Acropolis & zoom 16
await set("Zoom","16");
const lat = page.locator("label:has-text('Latitude') input").first(); 
console.log("initial view lat", await page.locator("aside label:has-text('Latitude') input, label:has-text('Latitude') input").evaluateAll(e=>e.map(x=>x.value)));
await page.waitForTimeout(1200);
await s.shot("mapeditor__bounds-typed-zoom16");
await page.locator("section:has(h2:has-text('Unplaced')) ul button", {hasText:"Place"}).first().click(); await page.waitForTimeout(800);
await page.locator("section:has(h2:has-text('Unplaced')) ul button", {hasText:"Place"}).first().click(); await page.waitForTimeout(800);
await page.evaluate(()=>window.scrollTo(0,0)); await page.locator("main, body").first().evaluate(()=>{}); 
await page.locator(".leaflet-container").scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
await s.shot("mapeditor__two-placed-visible");
const mk = await page.locator(".leaflet-marker-icon").evaluateAll(e=>e.map(x=>({title:x.getAttribute("title"),x:Math.round(x.getBoundingClientRect().x),y:Math.round(x.getBoundingClientRect().y)})));
console.log(mk);
const vals = async()=> page.locator("section:has(h2:has-text('Placed')) ol li input").evaluateAll(e=>e.map(x=>x.value));
console.log("before", await vals());
const cb = await page.locator(".leaflet-container").boundingBox(); console.log("canvas", cb);
// drag first marker
const first = page.locator(".leaflet-marker-icon").first(); const b = await first.boundingBox();
if (b && b.x>cb.x && b.x<cb.x+cb.width) {
 await page.mouse.move(b.x+13,b.y+13); await page.mouse.down(); await page.mouse.move(b.x+60,b.y+40,{steps:10}); await page.mouse.up(); await page.waitForTimeout(600);
 console.log("after drag", await vals());
}
// keyboard on marker
await first.focus(); await page.keyboard.press("ArrowRight"); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
console.log("after kb", await vals());
await s.shot("mapeditor__marker-keyboard");
// wheel zoom
await page.mouse.move(cb.x+cb.width/2, cb.y+cb.height/2); const zb = await page.getByText(/^zoom [\d.]+$/).first().innerText(); 
await page.mouse.wheel(0,-240); await page.waitForTimeout(800);
console.log("zoom", zb, "->", await page.getByText(/^zoom [\d.]+$/).first().innerText());
// keyboard pan/zoom on map region
await page.locator(".leaflet-container").focus(); await page.keyboard.press("+"); await page.waitForTimeout(500); await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(500);
console.log("kb zoom ->", await page.getByText(/^zoom [\d.]+$/).first().innerText());
console.log("map container focus ring:", await page.locator(".leaflet-container").evaluate(e=>getComputedStyle(e).outlineStyle));
await s.browser.close();
