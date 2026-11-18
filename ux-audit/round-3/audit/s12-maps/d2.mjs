import { open, go, shot, POP, run, log, start } from "./lib.mjs";
import { readFileSync } from "node:fs";
const MAP = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url))).map;
const vp = process.argv[2] || "768";
await run(async () => { try {
  const { browser, context, page } = await start(vp, { touch: true }); log("=== d2 move map", vp);
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(3000);
  const reg = page.locator("div.leaflet-container"); await reg.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  const btn = page.locator(".geo-map button[aria-pressed]");
  log("before", await btn.getAttribute("aria-pressed"), JSON.stringify(await btn.boundingBox()));
  await btn.tap(); await page.waitForTimeout(500);
  log("after tap", await btn.getAttribute("aria-pressed"), "touch-action", await reg.evaluate(e=>getComputedStyle(e).touchAction), "caption", await btn.evaluate(e=>e.parentElement.innerText));
  if ((await btn.getAttribute("aria-pressed")) !== "true") { await btn.click(); await page.waitForTimeout(400); log("after click", await btn.getAttribute("aria-pressed")); }
  await shot(page, "map-editor__touch-move-on", vp);
  const cdp = await context.newCDPSession(page);
  const bb = await reg.boundingBox(); const x = bb.x + bb.width/2, y = bb.y + bb.height*0.6;
  const s = (type, yy, xx=x) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type==="touchEnd"?[]:[{ x: xx, y: yy, id: 1 }] });
  const sc0 = await page.evaluate(()=>document.scrollingElement.scrollTop);
  const view = () => page.evaluate(()=>document.querySelector("div.leaflet-container").querySelector(".leaflet-map-pane").style.transform);
  await s("touchStart", y); for (let i=1;i<=10;i++){ await s("touchMove", y-15*i); await page.waitForTimeout(16);} await s("touchEnd", y-150); await page.waitForTimeout(500);
  log("swipe Move on: page scroll", sc0, "->", await page.evaluate(()=>document.scrollingElement.scrollTop), "mapPane", await view(), "fields lat/lng", await page.locator("#f-initialLatitude").inputValue(), await page.locator("#f-initialLongitude").inputValue());
  // Tap on handle with Edit bounds? Tap a zoom button
  await page.locator(".leaflet-control-zoom-in").tap(); await page.waitForTimeout(500);
  log("zoom in tap; zoom field", await page.locator("#f-initialZoom").inputValue(), "live", await page.evaluate(()=>[...document.querySelectorAll('[aria-live]')].map(l=>l.textContent).filter(Boolean)));
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,500)); } });
