import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("768", { touch: true }); const { page, context } = s;
const cdp = await context.newCDPSession(page);
const touch = async (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type==="touchEnd" ? [] : [{ x, y, id: 1 }] });
const drag = async (x0,y0,x1,y1) => { await touch("touchStart",x0,y0); for (let i=1;i<=10;i++){ await touch("touchMove", x0+(x1-x0)*i/10, y0+(y1-y0)*i/10); await page.waitForTimeout(20);} await touch("touchEnd"); await page.waitForTimeout(600); };
await go(page, `${P}/maps/${ids.map}`); await page.waitForTimeout(5000);
await page.locator(".leaflet-container").scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
const cb = await page.locator(".leaflet-container").boundingBox();
const iv = ()=> page.locator("section:has-text('Initial view') input").evaluateAll(e=>e.slice(0,3).map(x=>x.value).join(","));
console.log("view before", await iv());
await drag(cb.x+cb.width/2, cb.y+cb.height/2+50, cb.x+cb.width/2-80, cb.y+cb.height/2);
console.log("view after touch pan", await iv());
const m = page.locator(".leaflet-marker-icon").first(); const mb = await m.boundingBox();
console.log("marker box", mb, "canvas", cb);
if (mb.x>cb.x && mb.x<cb.x+cb.width && mb.y>cb.y && mb.y<cb.y+cb.height) {
const vm = ()=> page.locator("section:has(h2:has-text('Placed')) ol li input").first().inputValue();
console.log("lat before", await vm()); await drag(mb.x+13, mb.y+13, mb.x+60, mb.y+50); console.log("lat after", await vm());
}
// scroll page by touch starting on map
const sy = ()=>page.evaluate(()=>document.querySelector("main").scrollTop);
const a = await sy(); await drag(cb.x+cb.width/2, cb.y+cb.height-20, cb.x+cb.width/2, cb.y+20); console.log("main scroll from touch on map:", a, "->", await sy());
await s.shot("mapeditor__touch2");
await s.browser.close();
