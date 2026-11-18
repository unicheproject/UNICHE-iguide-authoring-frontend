import { open, go } from "../../../tools/session.mjs";

async function touchSwipe(cdp, x, y, dy) {
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - (dy * i) / 12 }] });
    await new Promise((r) => setTimeout(r, 16));
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const MAP = `/projects/${P}/maps/f8daa876-f2af-4552-95ae-431c96ed1b2d`;
const OUT = "ux-audit/round-2/implementation/P6/after/";
const out = {};
const { browser, context, page } = await open("admin", { viewport: "768", touch: true });
out.coarse = null;
await go(page, MAP);
await page.waitForSelector(".leaflet-container", { timeout: 30000 });
await page.waitForTimeout(2500);
out.coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
out.touchAction = await page.evaluate(() => getComputedStyle(document.querySelector(".leaflet-container")).touchAction);
out.hint = await page.locator("[data-map-gesture-hint]").innerText().catch(() => null);
const cdp = await context.newCDPSession(page);
const mainTop = () => page.evaluate(() => [document.querySelector("main").scrollTop, document.scrollingElement.scrollTop, document.getElementById("main")?.scrollTop].join("/"));
const box = await page.locator(".leaflet-container").first().boundingBox();
out.box = box;
await page.screenshot({ path: OUT + "map-touch-768.png" });
async function swipe(dy) {
  const box = await page.locator(".leaflet-container").first().boundingBox();
  await touchSwipe(cdp, box.x + box.width / 2, box.y + Math.min(box.height / 2, 400), dy);
  await page.waitForTimeout(500);
}
const before = await mainTop();
await swipe(250);
out.scrollRest = [before, await mainTop()];
const btn = page.getByRole("button", { name: "Move map" });
out.moveBtn = { count: await btn.count(), box: await btn.boundingBox() };
await btn.tap();
out.pressed = await btn.getAttribute("aria-pressed");
out.touchActionOn = await page.evaluate(() => getComputedStyle(document.querySelector(".leaflet-container")).touchAction);
await page.screenshot({ path: OUT + "map-touch-768-move-on.png" });
const b2 = await mainTop();
await swipe(250);
out.scrollMoveOn = [b2, await mainTop()];
await browser.close();
console.log(JSON.stringify(out, null, 1));
