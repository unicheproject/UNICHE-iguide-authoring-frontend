import { go, shot, POP, run, log, start, axe, box, focusDesc } from "./lib.mjs";
const vp = process.argv[2] || "1024"; const touch = process.argv[3] === "touch";
const MAP = "9fda753d-4d8e-4fba-9760-f300253e2060";
await run(async () => {
  const { page } = await start(vp, { touch });
  log("=== M5 map editor", vp, touch ? "touch" : "mouse");
  const open = async () => { await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForSelector(".leaflet-container"); await page.waitForTimeout(3500); };
  await open();
  await page.evaluate(() => { window.__log = []; new MutationObserver((ms) => { for (const m of ms) { const t = (m.target.nodeType === 3 ? m.target.parentElement : m.target); const live = t?.closest?.("[aria-live],[role=status],[role=alert]"); if (live) window.__log.push((live.getAttribute("role") || live.getAttribute("aria-live")) + ":" + live.textContent.trim().slice(0, 60)); } }).observe(document.body, { childList: true, characterData: true, subtree: true }); });
  await page.evaluate(() => document.querySelector(".leaflet-container").scrollIntoView({ block: "center" }));
  const tap = (l) => touch ? l.tap() : l.click();
  await tap(page.locator(".leaflet-control-zoom-in")); await page.waitForTimeout(1500);
  log("zoom in tap", await page.evaluate(() => window.__log.splice(0)));
  await tap(page.locator(".leaflet-control-zoom-in")); await page.waitForTimeout(1500);
  log("zoom in tap 2", await page.evaluate(() => window.__log.splice(0)));
  await tap(page.locator(".leaflet-control-zoom-out")); await page.waitForTimeout(1500);
  log("zoom out tap", await page.evaluate(() => window.__log.splice(0)));
  log("zoom btn sizes", await page.evaluate(() => [...document.querySelectorAll(".leaflet-control-zoom a")].map(a => { const b = a.getBoundingClientRect(); return Math.round(b.width) + "x" + Math.round(b.height); })));
  const mb = await page.evaluate(box(".leaflet-container")); log("map box", mb, "vh", await page.evaluate(() => innerHeight));
  log("move-map toggle", await page.evaluate(() => [...document.querySelectorAll(".geo-map button, .geo-map [role=button]")].map(b => (b.getAttribute("aria-label")||b.textContent).trim().slice(0,30) + ":" + b.getAttribute("aria-pressed"))), "hint", await page.evaluate(() => /Swiping|Move map/.test(document.querySelector(".geo-map").parentElement.innerText)));
  await shot(page, "map-editor__zoomed", vp);
  // scroll past the map
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.querySelector(".leaflet-container").scrollIntoView({ block: "start" }));
  const y0 = await page.evaluate(() => scrollY); const mb2 = await page.evaluate(box(".leaflet-container"));
  if (touch) { const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.synthesizeScrollGesture", { x: mb2.x + mb2.w / 2, y: mb2.y + mb2.h / 2, yDistance: -300, gestureSourceType: "touch", speed: 800 }); await page.waitForTimeout(900);
  } else { await page.mouse.move(mb2.x + mb2.w / 2, mb2.y + mb2.h / 2); await page.mouse.wheel(0, 300); await page.waitForTimeout(800); }
  log("scroll-past moved page by", (await page.evaluate(() => scrollY)) - y0);
  await shot(page, "map-editor__after-scroll-past", vp);
  // edit bounds handles
  await open();
  await page.getByRole("button", { name: "Edit bounds" }).click(); await page.waitForTimeout(2000);
  const hs = await page.evaluate(() => { const reg = document.querySelector('.leaflet-container'); const rb = reg.getBoundingClientRect();
    return [...reg.querySelectorAll(".leaflet-marker-icon")].map(m => { const b = m.getBoundingClientRect(); return { n: (m.getAttribute("aria-label")||"").slice(0,22), w: Math.round(b.width), h: Math.round(b.height), clip: [Math.round(Math.max(0, rb.top - b.top)), Math.round(Math.max(0, b.bottom - rb.bottom)), Math.round(Math.max(0, rb.left - b.left)), Math.round(Math.max(0, b.right - rb.right))].join("/") }; }); });
  log("HANDLES (t/b/l/r clip)", hs);
  await page.locator(".leaflet-container").scrollIntoViewIfNeeded();
  await shot(page, "map-editor__edit-bounds", vp);
  await axe(page, `map editor edit bounds ${vp}`);
  // tile failure
  await page.route(/tiles\.openfreemap\.org/, r => r.abort());
  await open(); await page.waitForTimeout(5000);
  const card = await page.evaluate(() => { const c = [...document.querySelectorAll("[role=alert],[role=status]")].find(e => /background could not/i.test(e.textContent)); if (!c) return null; const b = c.getBoundingClientRect(); const m = document.querySelector(".leaflet-container").getBoundingClientRect(); return { text: c.textContent.trim().slice(0, 120), y: Math.round(b.y), b: Math.round(b.bottom), mapY: Math.round(m.y), mapB: Math.round(m.bottom), vh: innerHeight, inside: b.y >= m.y - 1 && b.bottom <= m.bottom + 1 }; });
  log("tile card", card);
  await page.evaluate(() => document.querySelector(".leaflet-container").scrollIntoView({ block: "center" }));
  await shot(page, "map-editor__tiles-blocked", vp);
  await page.unroute(/tiles\.openfreemap\.org/);
  const retry = page.getByRole("button", { name: /Try again/ }); log("retry count", await retry.count());
  await page.keyboard.press("Tab").catch(()=>{});
  await retry.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(4000);
  log("focus after retry", await focusDesc(page), "card still", await page.locator("text=background could not").count());
  await shot(page, "map-editor__after-retry", vp);
});
