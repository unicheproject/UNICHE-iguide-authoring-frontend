import { go, shot, POP, run, log, start, axe, box, focusDesc } from "./lib.mjs";
const vp = process.argv[2] || "1440"; const touch = process.argv[3] === "touch";
const MAP = "9fda753d-4d8e-4fba-9760-f300253e2060";
await run(async () => {
  const { browser, page } = await start(vp, { touch });
  const reqs = []; page.on("request", r => { if (/openfreemap|tiles|basemaps|openstreetmap|maptiles/i.test(r.url())) reqs.push(r.url().slice(0, 80)); });
  log("=== M2 map editor", vp, touch ? "touch" : "mouse");
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(4500);
  await shot(page, "map-editor__default", vp, true);
  log("tile hosts", [...new Set(reqs.map(u => new URL(u).host))], "count", reqs.length);
  log("canvas present", await page.evaluate(() => ({ maplibre: !!document.querySelector(".maplibregl-canvas"), leafletRaster: document.querySelectorAll(".leaflet-tile-pane img").length, glCanvas: document.querySelectorAll("canvas").length })));
  log("attribution", await page.evaluate(() => document.querySelector(".leaflet-control-attribution")?.textContent));
  log("map regions", await page.evaluate(() => [...document.querySelectorAll('[role=region]')].map(e => e.getAttribute("aria-label"))), "role=main/landmark Map count", await page.evaluate(() => document.querySelectorAll('[aria-label="Map"]').length));
  log("maplibre aria-hidden", await page.evaluate(() => [...document.querySelectorAll(".maplibregl-canvas, .maplibregl-map, .maplibregl-canvas-container")].map(e => e.className.split(" ")[0] + ":" + e.getAttribute("aria-hidden") + "/" + e.getAttribute("role") + "/" + e.getAttribute("aria-label"))));
  log("status wrapper", await page.evaluate(() => [...document.querySelectorAll('[role=status]')].map(e => e.textContent.trim().slice(0, 40))));
  log("legend", await page.locator("[data-route-legend], [data-map-legend]").allInnerTexts());
  log("page text legend lines", (await page.locator("main").innerText()).split("\n").filter(l => /Pins|Routes|placed|drawn|Legend/i.test(l)).slice(0, 10));
  // visibility
  log("visibility box", await page.evaluate(box("#visibility")));
  log("visibility text", (await page.locator("#visibility").innerText().catch(()=>"(none)")).replace(/\n+/g, " | ").slice(0, 600));
  await page.locator("#visibility").scrollIntoViewIfNeeded().catch(() => {});
  await shot(page, "map-editor__visibility", vp);
  log("rows h", await page.evaluate(() => [...document.querySelectorAll("#visibility label")].slice(0, 4).map(l => Math.round(l.getBoundingClientRect().height))));
  // coordinate tidy
  const lat = page.locator("#f-initialLatitude"); await lat.scrollIntoViewIfNeeded();
  await lat.fill("37,970000"); await lat.blur(); log("initialLat after blur", await lat.inputValue());
  const minLat = page.locator("#f-minLatitude"); await minLat.fill("37.9700000"); await minLat.blur(); log("minLat after blur", await minLat.inputValue());
  await minLat.fill("abc"); await minLat.blur(); await page.waitForTimeout(300);
  log("minLat error", await page.locator('[id^=f-minLatitude][id$=error], #f-minLatitude-error').allInnerTexts(), "aria-invalid", await minLat.getAttribute("aria-invalid"));
  // zoom announcement
  await page.evaluate(() => document.querySelector(".leaflet-container[aria-label=Map], .geo-map").scrollIntoView({ block: "center" }));
  const lives = () => page.evaluate(() => [...document.querySelectorAll("[aria-live]")].map(l => l.textContent.trim()).filter(Boolean));
  await page.evaluate(() => { window.__log = []; const ls = [...document.querySelectorAll("[aria-live]")]; ls.forEach(l => new MutationObserver(() => window.__log.push(l.textContent.trim())).observe(l, { childList: true, characterData: true, subtree: true })); });
  await page.locator(".leaflet-control-zoom-in").click(); await page.waitForTimeout(1200);
  log("zoom announce log", await page.evaluate(() => window.__log));
  await page.keyboard.press("Escape");
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(3500);
  await page.getByRole("button", { name: "Edit bounds" }).click(); await page.waitForTimeout(1800);
  const hs = await page.evaluate(() => { const reg = document.querySelector('.leaflet-container'); const rb = reg.getBoundingClientRect();
    return { map: [Math.round(rb.x), Math.round(rb.y), Math.round(rb.width), Math.round(rb.height)], handles: [...reg.querySelectorAll(".leaflet-marker-icon")].map(m => { const b = m.getBoundingClientRect(); const cl = { top: Math.round(Math.max(0, rb.top - b.top)), bottom: Math.round(Math.max(0, b.bottom - rb.bottom)), left: Math.round(Math.max(0, rb.left - b.left)), right: Math.round(Math.max(0, b.right - rb.right)) }; return { n: (m.getAttribute("aria-label") || m.className).slice(0, 30), w: Math.round(b.width), h: Math.round(b.height), clip: cl }; }) }; });
  log("HANDLES", hs);
  await page.locator(".leaflet-container").scrollIntoViewIfNeeded();
  await shot(page, "map-editor__edit-bounds", vp);
  const h0 = page.locator('.leaflet-marker-icon[aria-label*="area"]').first(); await h0.focus(); await shot(page, "map-editor__handle-focus", vp);
  await axe(page, `map editor edit bounds ${vp}`);
  await browser.close();
});
