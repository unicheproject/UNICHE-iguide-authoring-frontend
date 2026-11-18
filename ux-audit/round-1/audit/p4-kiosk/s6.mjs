import { open, go, P, shot, small } from "./lib.mjs";
const log = (...a) => console.log(...a);
const { browser, context, page } = await open("curator", { viewport: "1024", touch: true });
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1200);
await page.getByRole("link", { name: /UX-p4-kiosk POI one/ }).first().tap(); await page.waitForTimeout(2000);
const cdp = await context.newCDPSession(page);
const touch = async (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x,y],i)=>({x,y,id:i})) });
const map = page.locator(".leaflet-container").first();
await map.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
let b = await map.boundingBox(); const cx = b.x+b.width/2, cy = b.y+b.height/2;
const lat = () => page.locator("#f-lat").inputValue(), lng = () => page.locator("input[id^=f-l]").nth(1).inputValue();
// tap to place
await page.touchscreen.tap(cx, cy); await page.waitForTimeout(700);
log("after tap", await lat(), await lng()); await shot(page, "touch-map__tap-placed__1024");
// drag pin
const marker = page.locator(".leaflet-marker-icon").filter({ hasNot: page.locator("xx") });
const mk = await page.locator(".leaflet-marker-draggable").first().boundingBox().catch(()=>null);
log("draggable marker box", JSON.stringify(mk));
if (mk) {
  const sx = mk.x+mk.width/2, sy = mk.y+mk.height/2;
  await touch("touchStart", [[sx,sy]]);
  for (let i=1;i<=10;i++) await touch("touchMove", [[sx+i*6, sy+i*4]]);
  await touch("touchEnd", []); await page.waitForTimeout(600);
  log("after drag", await lat(), await lng(), "scrollY", await page.evaluate(()=>document.querySelector("main").scrollTop));
  await shot(page, "touch-map__pin-dragged__1024");
}
// pan with one finger on empty map area (from corner)
const sy0 = await page.evaluate(()=>document.querySelector("main").scrollTop);
await touch("touchStart", [[b.x+40,b.y+b.height-60]]);
for (let i=1;i<=10;i++) await touch("touchMove", [[b.x+40+i*8, b.y+b.height-60-i*10]]);
await touch("touchEnd", []); await page.waitForTimeout(500);
log("pan: main scroll before/after", sy0, await page.evaluate(()=>document.querySelector("main").scrollTop), "lat", await lat());
await shot(page, "touch-map__panned__1024");
// pinch zoom
const z0 = await page.evaluate(()=>document.querySelector(".leaflet-tile-container")?.firstElementChild?.getAttribute("src")?.match(/\/(\d+)\/\d+\/\d+/)?.[1]);
await touch("touchStart", [[cx-20,cy],[cx+20,cy]]);
for (let i=1;i<=10;i++) await touch("touchMove", [[cx-20-i*7,cy],[cx+20+i*7,cy]]);
await touch("touchEnd", []); await page.waitForTimeout(700);
log("zoom tile before", z0, "after", await page.evaluate(()=>document.querySelector(".leaflet-tile-container")?.firstElementChild?.getAttribute("src")?.match(/\/(\d+)\/\d+\/\d+/)?.[1]));
await shot(page, "touch-map__pinched__1024");
// zoom button sizes
log("zoom btn", JSON.stringify(await page.locator(".leaflet-control-zoom a").evaluateAll(a=>a.map(x=>{const r=x.getBoundingClientRect();return [r.width,r.height]}))));
// type coordinates + save
await page.locator("#f-lat").fill("37.9715"); await page.locator("input[id^=f-l]").nth(1).fill("23.7267"); await page.waitForTimeout(500);
await shot(page, "touch-map__typed-coords__1024");
// Preview in app on draft, on-screen keyboard height
await page.setViewportSize({ width: 1024, height: 400 });
await page.getByRole("button",{name:/Preview in app/}).tap(); await page.waitForTimeout(900);
await shot(page, "poi-own__preview-in-app__1024x400");
await browser.close();
