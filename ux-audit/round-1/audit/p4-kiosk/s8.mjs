import { open, go, P, shot, small } from "./lib.mjs";
const log = (...a) => console.log(...a);
const FP="d40864d1-684a-466f-819d-68fa651b7146";
const { browser, context, page } = await open("curator", { viewport: "1024", touch: true });
const cdp = await context.newCDPSession(page);
const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x,y],i)=>({x,y,id:i})) });
await go(page, `/projects/${P}/floor-plans/${FP}`); await page.waitForTimeout(2500);
const pin = page.locator("main button[aria-label^='2.']").first();
await pin.scrollIntoViewIfNeeded();
const b = await pin.boundingBox(); log("pin2", JSON.stringify(b), await pin.getAttribute("aria-label"));
const xs = () => page.locator("main input").evaluateAll(a=>a.slice(0,3).map(i=>i.value));
log("before", await xs());
const sx=b.x+b.width/2, sy=b.y+b.height/2;
const m0 = await page.evaluate(()=>document.querySelector("main").scrollTop);
await touch("touchStart", [[sx,sy]]); for (let i=1;i<=10;i++) await touch("touchMove", [[sx+i*5, sy+i*6]]); await touch("touchEnd", []);
await page.waitForTimeout(600);
log("after drag pin2 inputs", await xs(), "scroll", m0, await page.evaluate(()=>document.querySelector("main").scrollTop));
await shot(page, "touch-floorplan__pin-dragged__1024");
// tap-to-place an unplaced Resource: "Place" button then tap plan
const place = page.getByRole("button", { name: "Place" }).first();
log("place aria", await place.getAttribute("aria-label"));
await place.scrollIntoViewIfNeeded(); await shot(page, "touch-floorplan__unplaced-list__1024");
await place.tap(); await page.waitForTimeout(600); await shot(page, "touch-floorplan__after-place-tap__1024");
log("placed count text", await page.getByText(/Placed \(/).first().textContent());
// discard: reload
await page.reload(); await page.waitForTimeout(1500);
log("after reload placed", await page.getByText(/Placed \(/).first().textContent());
// swipe-scroll over plan image
await page.locator("main img").first().scrollIntoViewIfNeeded();
const ib = await page.locator("main img").first().boundingBox();
const s0 = await page.evaluate(()=>document.querySelector("main").scrollTop);
await touch("touchStart", [[ib.x+ib.width/2, ib.y+ib.height-20]]); for (let i=1;i<=10;i++) await touch("touchMove", [[ib.x+ib.width/2, ib.y+ib.height-20-i*12]]); await touch("touchEnd", []);
await page.waitForTimeout(400);
log("swipe over plan scroll", s0, await page.evaluate(()=>document.querySelector("main").scrollTop), JSON.stringify(await xs()));
await browser.close();
