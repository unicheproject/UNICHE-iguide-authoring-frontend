import { open, go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
import { readFileSync } from "node:fs";
const MAP = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url))).map;
const vp = process.argv[2] || "768";
const sz = (sel) => `(() => { const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; const b=e.getBoundingClientRect(); return Math.round(b.width)+"x"+Math.round(b.height); })()`;
await run(async () => { try {
  const { browser, context, page } = await start(vp, { touch: true }); log("=== d1 touch", vp);
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(3000);
  log("coarse?", await page.evaluate(() => matchMedia("(pointer: coarse)").matches));
  await shot(page, "map-editor__touch-default", vp);
  const reg = page.locator("div.leaflet-container"); await reg.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await shot(page, "map-editor__touch-map-fold", vp);
  log("sizes", { moveMap: await page.evaluate(sz(".geo-map button[aria-pressed]")), zoomIn: await page.evaluate(sz(".leaflet-control-zoom-in")), zoomOut: await page.evaluate(sz(".leaflet-control-zoom-out")), edit: await page.getByRole("button",{name:"Edit bounds"}).evaluate(e=>{const b=e.getBoundingClientRect();return Math.round(b.width)+"x"+Math.round(b.height)}), disclosure: await page.getByRole("button",{name:/visitor filter/}).evaluate(e=>{const b=e.getBoundingClientRect();return Math.round(b.width)+"x"+Math.round(b.height)}), region: await page.evaluate(sz("div.leaflet-container")), attribution: await page.evaluate(sz(".leaflet-control-attribution")) });
  log("hint", await page.locator("[data-map-gesture-hint]").allInnerTexts(), "move label", await page.locator(".geo-map button[aria-pressed]").evaluate(e=>e.parentElement.innerText));
  // swipe over map at rest
  const cdp = await context.newCDPSession(page);
  const swipe = async (dy) => { const bb = await reg.boundingBox(); const x = bb.x + bb.width/2, y = bb.y + bb.height*0.7; const s = async (type, yy) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type==="touchEnd"?[]:[{ x, y: yy, id: 1 }] }); await s("touchStart", y); for (let i=1;i<=10;i++){ await s("touchMove", y - dy*i/10); await page.waitForTimeout(16);} await s("touchEnd", y-dy); await page.waitForTimeout(500); };
  const sy0 = await page.evaluate(()=>[document.scrollingElement.scrollTop, ...[...document.querySelectorAll("*")].filter(e=>e.scrollTop>0&&e.scrollHeight>e.clientHeight+50).map(e=>e.scrollTop)]);
  const mc0 = await page.evaluate(()=>document.querySelector(".leaflet-map-pane").style.transform);
  await swipe(200);
  const sy1 = await page.evaluate(()=>[document.scrollingElement.scrollTop, ...[...document.querySelectorAll("*")].filter(e=>e.scrollTop>0&&e.scrollHeight>e.clientHeight+50).map(e=>e.scrollTop)]);
  const mc1 = await page.evaluate(()=>document.querySelector(".leaflet-map-pane").style.transform);
  log("swipe at rest: scroll", sy0, "->", sy1, "map pane", mc0, "->", mc1, "touch-action", await reg.evaluate(e=>getComputedStyle(e).touchAction));
  // Move map on
  await reg.scrollIntoViewIfNeeded();
  await page.locator(".geo-map button[aria-pressed]").tap(); await page.waitForTimeout(300);
  await shot(page, "map-editor__touch-move-on", vp);
  log("move on touch-action", await reg.evaluate(e=>getComputedStyle(e).touchAction), "pressed", await page.locator(".geo-map button[aria-pressed]").getAttribute("aria-pressed"), "caption", await page.locator(".geo-map button[aria-pressed]").evaluate(e=>e.parentElement.innerText));
  const sy2 = await page.evaluate(()=>document.scrollingElement.scrollTop); await swipe(150); 
  log("swipe with Move on: scroll", sy2, "->", await page.evaluate(()=>document.scrollingElement.scrollTop), "map pane", await page.evaluate(()=>document.querySelector(".leaflet-map-pane").style.transform));
  await page.locator(".geo-map button[aria-pressed]").tap();
  // Edit bounds touch: handle sizes
  await page.getByRole("button",{name:"Edit bounds"}).tap(); await page.waitForTimeout(1200);
  await reg.scrollIntoViewIfNeeded(); await shot(page, "map-editor__touch-edit-bounds", vp);
  log("handles", await page.evaluate(() => [...document.querySelectorAll(".leaflet-marker-icon.map-handle")].map(m => { const b=m.getBoundingClientRect(); const i=m.firstElementChild?.getBoundingClientRect(); const r=document.querySelector("div.leaflet-container").getBoundingClientRect(); return `${m.getAttribute("aria-label").split(" of")[0]} hit ${Math.round(b.width)}x${Math.round(b.height)} inner ${i?Math.round(i.width):"-"} clipT ${Math.round(Math.max(0,r.top-b.top))} clipB ${Math.round(Math.max(0,b.bottom-r.bottom))}`; })));
  log("modeText", await page.locator(".geo-map ~ p, .geo-map + p").allInnerTexts());
  await page.getByRole("button", { name: /Done editing/ }).tap();
  // visibility/filter checkbox sizes
  log("vis row sizes", await page.evaluate(() => [...document.querySelectorAll('#visibility input[type=checkbox]')].slice(0,3).map(c => { const b=c.getBoundingClientRect(); const row=c.closest("label")?.getBoundingClientRect(); return `box ${Math.round(b.width)}x${Math.round(b.height)} row ${Math.round(row.width)}x${Math.round(row.height)}`; })));
  await page.getByRole("button",{name:/visitor filter/}).tap(); await page.waitForTimeout(300);
  log("filter radio sizes", await page.evaluate(() => [...document.querySelectorAll('input[name^="visitor-filter"]')].slice(0,3).map(c => { const b=c.getBoundingClientRect(); const row=c.closest("label").getBoundingClientRect(); return `box ${Math.round(b.width)}x${Math.round(b.height)} row ${Math.round(row.width)}x${Math.round(row.height)}`; })));
  log("other small targets", await page.evaluate(() => [...document.querySelectorAll("main button, main a, main input:not([type=radio]):not([type=checkbox]), main select")].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.height<44||b.width<44)&&!e.closest(".leaflet-container")}).slice(0,15).map(e=>`${e.tagName} "${(e.getAttribute("aria-label")||e.innerText||e.id).trim().slice(0,28)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)));
  await axe(page, "map editor touch "+vp);
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,500)); } });
