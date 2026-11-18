import { open, go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
import { readFileSync } from "node:fs";
const MAP = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url))).map;
const vp = process.argv[2] || "1440";
const R = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
await run(async () => { try {
  const { browser, page } = await start(vp); log("=== c1 map editor", vp);
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(3000);
  await shot(page, "map-editor__default", vp, true);
  await shot(page, "map-editor__default-fold", vp);
  log("H1", await page.locator("h1").allInnerTexts());
  log("MAPCTRL", await page.evaluate(() => {
    const R = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x*10)/10, y: Math.round(b.y*10)/10, w: Math.round(b.width*10)/10, h: Math.round(b.height*10)/10 }; };
    const reg = document.querySelector('div.leaflet-container[aria-label=Map]');
    return { region: R(reg), zoomIn: R(reg.querySelector(".leaflet-control-zoom-in")), zoomOut: R(reg.querySelector(".leaflet-control-zoom-out")), attr: R(reg.querySelector(".leaflet-control-attribution")),
      zoomInName: reg.querySelector(".leaflet-control-zoom-in").getAttribute("aria-label")||reg.querySelector(".leaflet-control-zoom-in").title,
      zoomInDis: reg.querySelector(".leaflet-control-zoom-in").className, zoomOutDis: reg.querySelector(".leaflet-control-zoom-out").className,
      attrText: reg.querySelector(".leaflet-control-attribution")?.innerText };
  }));
  log("CHIP/CARD", await page.evaluate(() => ({ chip: !!document.querySelector(".z-sticky"), alert: [...document.querySelectorAll('[role=alert]')].map(a=>a.innerText) })));
  // Tab order from the name field through to "Placed on this map"
  await page.locator("#f-internalName").focus();
  const stops = [];
  for (let i = 0; i < 40; i++) { await page.keyboard.press("Tab"); const d = await focusDesc(page); stops.push(d); if (/Latitude|Min latitude/.test(d) ) break; }
  log("TABSTOPS name->first bounds field", stops);
  // Edit bounds
  await page.getByRole("button", { name: "Edit bounds" }).click(); await page.waitForTimeout(1500);
  await shot(page, "map-editor__edit-bounds", vp);
  log("HANDLES", await page.evaluate(() => {
    const reg = document.querySelector('div.leaflet-container[aria-label=Map]'); const rb = reg.getBoundingClientRect();
    return [...reg.querySelectorAll(".leaflet-marker-icon")].filter(m=>/of the area/.test(m.getAttribute("aria-label")||"")).map(m => { const b = m.getBoundingClientRect(); const cs = getComputedStyle(m);
      return { name: m.getAttribute("aria-label").split(".")[0], x: Math.round(b.x - rb.x), y: Math.round(b.y - rb.y), w: Math.round(b.width), h: Math.round(b.height), clippedL: Math.round(Math.max(0, rb.x - b.x)), clippedR: Math.round(Math.max(0, b.right - rb.right)), clippedT: Math.round(Math.max(0, rb.y - b.y)), clippedB: Math.round(Math.max(0, b.bottom - rb.bottom)), tabindex: m.getAttribute("tabindex"), role: m.getAttribute("role") }; });
  }));
  log("TAB INTO HANDLES"); 
  const hs = page.locator('.leaflet-marker-icon[aria-label*="of the area"]');
  log("handle count", await hs.count());
  await hs.first().focus(); await page.waitForTimeout(200);
  await shot(page, "map-editor__handle-focus", vp);
  log("handle focus ring", await hs.first().evaluate(e => { const cs = getComputedStyle(e); return { outline: cs.outline, boxShadow: cs.boxShadow, inner: e.firstElementChild ? getComputedStyle(e.firstElementChild).boxShadow : null }; }));
  const before = await Promise.all(["Min latitude","Max latitude","Min longitude","Max longitude"].map(l=>page.getByLabel(l).inputValue()));
  for (let i=0;i<3;i++) await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(500);
  const after = await Promise.all(["Min latitude","Max latitude","Min longitude","Max longitude"].map(l=>page.getByLabel(l).inputValue()));
  log("BOUNDS before", before, "after arrow", after, "focus", await focusDesc(page));
  await shot(page, "map-editor__bounds-nudged", vp);
  log("LIVE", await page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map(l => l.id + ":" + l.textContent.slice(0,120))));
  // number formatting
  log("COORD FORMAT", before, after);
  await page.getByRole("button", { name: /Done editing bounds/ }).click(); await page.waitForTimeout(600);
  log("after Done fields", await Promise.all(["Latitude","Longitude","Zoom"].map(l=>page.locator(`#f-initial${l==="Zoom"?"Zoom":l+"" }`).inputValue().catch(()=>"?"))));
  await shot(page, "map-editor__after-done", vp);
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,500)); } });
