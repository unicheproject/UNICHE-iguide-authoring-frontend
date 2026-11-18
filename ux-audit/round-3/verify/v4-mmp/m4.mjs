import { go, shot, POP, run, log, start, axe, box, focusDesc } from "./lib.mjs";
const vp = process.argv[2] || "1024"; const touch = process.argv[3] === "touch";
const MAP = "9fda753d-4d8e-4fba-9760-f300253e2060";
await run(async () => {
  const { browser, page } = await start(vp, { touch });
  log("=== M4 map editor tablet", vp, touch ? "touch" : "mouse");
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForSelector(".leaflet-container",{timeout:20000}).catch(()=>log("NO leaflet-container")); await page.waitForTimeout(4000);
  await page.evaluate(() => { window.__log = []; new MutationObserver((ms) => { for (const m of ms) { const t = (m.target.nodeType === 3 ? m.target.parentElement : m.target); const live = t.closest?.("[aria-live],[role=status],[role=alert]"); if (live) window.__log.push(live.textContent.trim().slice(0, 60)); } }).observe(document.body, { childList: true, characterData: true, subtree: true }); });
  await page.evaluate(() => document.querySelector(".leaflet-container").scrollIntoView({ block: "center" }));
  const tap = (l) => touch ? l.tap() : l.click();
  await tap(page.locator(".leaflet-control-zoom-out")); await page.waitForTimeout(1200);
  log("zoom out", await page.evaluate(() => window.__log.splice(0)));
  await tap(page.locator(".leaflet-control-zoom-in")); await page.waitForTimeout(1200);
  log("zoom in", await page.evaluate(() => window.__log.splice(0)));
  await tap(page.locator(".leaflet-control-zoom-in")); await page.waitForTimeout(1200);
  log("zoom in 2", await page.evaluate(() => window.__log.splice(0)));
  // scroll past map by touch/wheel: start a swipe on the map
  await page.evaluate(() => window.scrollTo(0, 0));
  const m = await page.evaluate(box(".leaflet-container")); log("map box", m, "vh", await page.evaluate(() => innerHeight));
  await page.evaluate(() => document.querySelector(".leaflet-container").scrollIntoView({ block: "start" }));
  const y0 = await page.evaluate(() => scrollY);
  if (touch) { const cdp = await page.context().newCDPSession(page); const mb = await page.evaluate(box(".leaflet-container"));
    await cdp.send("Input.synthesizeScrollGesture", { x: mb.x + mb.w / 2, y: mb.y + mb.h / 2, yDistance: -300, gestureSourceType: "touch", speed: 800 }); await page.waitForTimeout(800);
  } else { const mb = await page.evaluate(box(".leaflet-container")); await page.mouse.move(mb.x + mb.w / 2, mb.y + mb.h / 2); await page.mouse.wheel(0, 300); await page.waitForTimeout(800); }
  log("scroll moved page by", await page.evaluate(() => scrollY) - y0);
  await shot(page, "map-editor__after-scroll-past", vp);
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Edit bounds" }).click(); await page.waitForTimeout(1800);
  const hs = await page.evaluate(() => { const reg = document.querySelector('.leaflet-container'); const rb = reg.getBoundingClientRect();
    return [...reg.querySelectorAll(".leaflet-marker-icon")].map(m => { const b = m.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), clip: [Math.round(Math.max(0, rb.top - b.top)), Math.round(Math.max(0, b.bottom - rb.bottom)), Math.round(Math.max(0, rb.left - b.left)), Math.round(Math.max(0, b.right - rb.right))].join("/") }; }); });
  log("HANDLES", hs);
  await page.locator(".leaflet-container").scrollIntoViewIfNeeded();
  await shot(page, "map-editor__edit-bounds", vp);
  await axe(page, `map editor edit bounds ${vp}`);
  await browser.close();
});
