import { go, shot, POP, MAP, run, log, start, axe, box, focusDesc } from "./lib.mjs";
const vp = process.argv[2] || "1440"; const touch = process.argv[3] === "touch";
await run(async () => {
  const { browser, page } = await start(vp, { touch });
  log("=== map editor", vp, touch ? "touch" : "mouse");
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(3500);
  await shot(page, `map-editor__default${touch ? "-touch" : ""}`, vp, true);
  log("regions named Map", await page.evaluate(() => document.querySelectorAll('[role=region][aria-label=Map]').length), "aria-hidden maplibre", await page.evaluate(() => [...document.querySelectorAll(".maplibregl-canvas, .maplibregl-canvas-container")].map(e => e.getAttribute("aria-hidden") + "/" + e.getAttribute("role"))));
  log("status wrapper", await page.evaluate(() => !!document.querySelector('.geo-map [role=status]')));
  log("legend", await page.locator("[data-route-legend]").allInnerTexts());
  // visibility
  await page.locator("#visibility").scrollIntoViewIfNeeded().catch(() => {});
  const vis = page.locator("section#visibility, #visibility").first();
  log("visibility height collapsed", await page.evaluate(box("#visibility")));
  log("visibility buttons", await page.locator('#visibility button[aria-expanded]').allInnerTexts());
  const cbs = await page.evaluate(() => [...document.querySelectorAll("#visibility label")].slice(0, 6).map(l => { const b = l.getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)}`; }));
  log("checkbox rows", cbs);
  await shot(page, `map-editor__visibility${touch ? "-touch" : ""}`, vp);
  const exp = page.locator('#visibility button[aria-expanded]').first();
  if (await exp.count()) { await exp.click(); await page.waitForTimeout(300); log("expanded rows", await page.evaluate(() => [...document.querySelectorAll("#visibility label")].slice(0, 5).map(l => { const b = l.getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)} ${l.innerText.replace(/\n/g," ").slice(0,60)}`; }))); await shot(page, `map-editor__visibility-open${touch ? "-touch" : ""}`, vp); }
  // coordinate tidy
  await page.locator("#f-initialLatitude").scrollIntoViewIfNeeded();
  await page.locator("#f-initialLatitude").fill("37,970000"); await page.locator("#f-initialLatitude").blur();
  log("lat after blur", await page.locator("#f-initialLatitude").inputValue());
  await page.locator("#f-minLatitude").fill("abc"); await page.locator("#f-minLatitude").blur();
  // zoom announcement
  await page.evaluate(() => document.querySelector(".geo-map").scrollIntoView({ block: "center" }));
  await page.locator(".leaflet-control-zoom-in").click(); await page.waitForTimeout(900);
  log("live after zoom click", await page.evaluate(() => [...document.querySelectorAll("[aria-live]")].map(l => l.textContent.trim().slice(0, 60))));
  // edit bounds (restore bounds first: reload)
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Edit bounds" }).click(); await page.waitForTimeout(1500);
  const hs = await page.evaluate(() => { const reg = document.querySelector('div.leaflet-container[aria-label=Map]'); const rb = reg.getBoundingClientRect(); const at = reg.querySelector(".leaflet-control-attribution")?.getBoundingClientRect();
    return { attr: at ? { y: Math.round(at.y - rb.y), h: Math.round(at.height), x: Math.round(at.x - rb.x) } : null, mapH: Math.round(rb.height), handles: [...reg.querySelectorAll(".leaflet-marker-icon")].filter(m => /of the area/.test(m.getAttribute("aria-label") || "")).map(m => { const b = m.getBoundingClientRect(); const dot = m.firstElementChild.getBoundingClientRect(); return { n: m.getAttribute("aria-label").split(" ")[0], clip: [Math.round(Math.max(0, rb.x - b.x)), Math.round(Math.max(0, b.right - rb.right)), Math.round(Math.max(0, rb.y - b.y)), Math.round(Math.max(0, b.bottom - rb.bottom))], dotTop: Math.round(dot.y - rb.y), dotBottom: Math.round(rb.bottom - dot.bottom), overAttr: at ? !(dot.bottom <= at.y || dot.y >= at.bottom || dot.right <= at.x || dot.x >= at.right) : false }; }) }; });
  log("HANDLES", hs);
  await shot(page, `map-editor__edit-bounds${touch ? "-touch" : ""}`, vp);
  await axe(page, `map editor edit bounds ${vp}`);
  await browser.close();
});
