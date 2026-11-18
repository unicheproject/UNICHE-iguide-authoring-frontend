import { open, go, P, seed, shot, settle } from "./lib.mjs";
const fp = seed.floorPlans[0].id;
const { browser, page } = await open("curator", { viewport: "1024", touch: true });
await go(page, `/projects/${P}/floor-plans/${fp}`); await settle(page, 3500);
const pins = await page.evaluate(() => [...document.querySelectorAll("[data-pin], [data-placement], [class*=pin]")].slice(0,6).map(e=>({c:e.className.toString().slice(0,50), r:[Math.round(e.getBoundingClientRect().width),Math.round(e.getBoundingClientRect().height)], role:e.getAttribute("role"), label:e.getAttribute("aria-label")})));
console.log("pins", JSON.stringify(pins));
const place = page.getByRole("button", { name: /^Place/ }).first();
console.log("place btn", await place.textContent(), JSON.stringify(await place.boundingBox()));
await place.scrollIntoViewIfNeeded(); await place.tap(); await page.waitForTimeout(700);
console.log("after arm: statuses", await page.locator("[role=status]").allTextContents(), "| hint:", await page.getByText(/Tap the plan|Placing|Cancel/).allTextContents());
await shot(page, "floorplan-editor__armed__1024", false);
const img = page.locator("img").filter({ has: page.locator("xpath=.") }).first();
const canvas = page.locator("[data-floor-canvas], .floor-plan-canvas, [data-plan]").first();
const bb = (await canvas.count()) ? await canvas.boundingBox() : null; console.log("canvas", JSON.stringify(bb));
const imgs = await page.locator("main img").evaluateAll(a=>a.map(i=>({src:i.src.slice(-30), r:i.getBoundingClientRect().toJSON()})).filter(x=>x.r.width>300)); console.log("imgs", JSON.stringify(imgs));
if (imgs[0]) { const r = imgs[0].r; await page.evaluate((y)=>window.scrollBy(0,0), 0); await page.touchscreen.tap(r.x + r.width*0.7, Math.min(r.y + r.height*0.5, 700)); await page.waitForTimeout(900); }
console.log("after tap statuses", await page.locator("[role=status]").allTextContents());
await shot(page, "floorplan-editor__after-placement-tap__1024", false);
console.log("banner", await page.getByText(/Working Copy/).first().textContent());
// nothing saved: leave without saving
await browser.close();
