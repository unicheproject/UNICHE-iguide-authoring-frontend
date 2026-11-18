import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("768", { touch: true }); const { page, context } = s;
const cdp = await context.newCDPSession(page);
const touch = async (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type==="touchEnd" ? [] : [{ x, y, id: 1 }] });
const drag = async (x0,y0,x1,y1) => { await touch("touchStart",x0,y0); for (let i=1;i<=10;i++){ await touch("touchMove", x0+(x1-x0)*i/10, y0+(y1-y0)*i/10); await page.waitForTimeout(20);} await touch("touchEnd"); await page.waitForTimeout(500); };
// floor plan (active w/ working copy exists? discard not needed: edits are only local)
await go(page, `${P}/floor-plans/${ids.plan}`); await page.waitForTimeout(2500);
const mk = page.locator("button[aria-label*='arrow keys']");
await page.locator("img[draggable=false]").scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
const vals = ()=> page.locator("section:has(h2:has-text('Placed')) ol li input").evaluateAll(e=>e.map(x=>x.value).join(","));
console.log("fp before", await vals(), "scrollY", await page.evaluate(()=>document.querySelector("main").scrollTop));
let b = await mk.nth(0).boundingBox();
const st = await page.evaluate(()=>document.querySelector("main").scrollTop);
await drag(b.x+b.width/2, b.y+b.height/2, b.x+b.width/2+60, b.y+b.height/2+60);
console.log("fp after touch drag", await vals(), "scrollTop moved:", (await page.evaluate(()=>document.querySelector("main").scrollTop))-st);
await s.shot("fpeditor__touch-dragged");
console.log("fp marker size", b.width, b.height);
// map editor touch
await go(page, `${P}/maps/${ids.map}`); await page.waitForTimeout(5000);
await page.locator(".leaflet-container").scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
const cb = await page.locator(".leaflet-container").boundingBox();
const zoomTxt = ()=>page.getByText(/^zoom [\d.]+$/).first().innerText();
const cv = async()=> (await page.locator("label:has-text('Latitude') input").first().inputValue());
console.log("map view lat before", await cv(), await zoomTxt());
await drag(cb.x+cb.width/2, cb.y+cb.height/2, cb.x+cb.width/2-80, cb.y+cb.height/2-40);
console.log("map view lat after pan", await cv(), await zoomTxt());
// pinch
await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:cb.x+cb.width/2-30,y:cb.y+200,id:1},{x:cb.x+cb.width/2+30,y:cb.y+200,id:2}]});
for (let i=1;i<=10;i++) await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:cb.x+cb.width/2-30-i*8,y:cb.y+200,id:1},{x:cb.x+cb.width/2+30+i*8,y:cb.y+200,id:2}]});
await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]}); await page.waitForTimeout(800);
console.log("after pinch", await zoomTxt());
// marker touch drag
const m = page.locator(".leaflet-marker-icon").first(); const mb = await m.boundingBox();
console.log("map marker", mb);
const vm = ()=> page.locator("section:has(h2:has-text('Placed')) ol li input").first().inputValue();
console.log("marker lat before", await vm());
await page.mouse.wheel(0,0);
await drag(mb.x+13, mb.y+13, mb.x+60, mb.y+50);
console.log("marker lat after touch drag", await vm());
// page scroll via touch over the map
const sy0 = await page.evaluate(()=>document.querySelector("main").scrollTop);
console.log("page scroll trap: main scrollTop", sy0);
// zoom button sizes
console.log(await page.evaluate(()=>[...document.querySelectorAll(".leaflet-control-zoom a, .map-tool, [aria-label='Visitor filter preview'] button")].slice(0,6).map(e=>{const b=e.getBoundingClientRect();return (e.getAttribute("aria-label")||e.textContent.trim()).slice(0,14)+":"+Math.round(b.width)+"x"+Math.round(b.height)})));
await s.shot("mapeditor__touch");
await s.browser.close();
