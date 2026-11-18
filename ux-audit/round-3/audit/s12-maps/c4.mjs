import { open, go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
import { readFileSync } from "node:fs";
const MAP = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url))).map;
const vp = process.argv[2] || "1440";
const HOSTS = /tiles\.openfreemap\.org|tile\.openstreetmap\.org/;
await run(async () => { try {
  const { browser, page } = await start(vp); log("=== c4 tiles", vp);
  // slow: delay 6s then fail
  let mode = "slow";
  await page.route(HOSTS, async (r) => { if (mode === "slow") { await new Promise(s => setTimeout(s, 6000)); } if (mode === "ok") return r.continue(); return r.abort("connectionrefused"); });
  await page.goto(`http://localhost:5173/projects/${POP}/maps/${MAP}`);
  await page.waitForTimeout(2500);
  log("chip", await page.evaluate(() => { const c = document.querySelector(".geo-map .z-sticky"); if(!c) return null; const b=c.getBoundingClientRect(); const m=document.querySelector("div.leaflet-container").getBoundingClientRect(); return { text: c.textContent.trim(), x: Math.round(b.x-m.x), y: Math.round(b.y-m.y), w: Math.round(b.width), h: Math.round(b.height), centered: Math.round((b.x+b.width/2)-(m.x+m.width/2)), role: c.getAttribute("role"), live: c.getAttribute("aria-live"), anim: document.getAnimations().length }; }));
  await shot(page, "map-editor__tiles-loading", vp);
  mode = "fail"; await page.waitForTimeout(7000);
  log("card", await page.evaluate(() => { const a=[...document.querySelectorAll('.geo-map [role=alert], .geo-map [role=status], .geo-map .alert')]; return a.map(x=>({t:x.innerText, r:(()=>{const b=x.getBoundingClientRect();return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]})()})); }));
  await page.locator("div.leaflet-container").scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await shot(page, "map-editor__tiles-failed", vp);
  const retry = page.getByRole("button", { name: /try again/i });
  log("retry btn", await retry.count(), await retry.first().evaluate(e=>{const b=e.getBoundingClientRect();return [Math.round(b.width),Math.round(b.height)]}).catch(()=>null));
  // card vs controls overlap
  log("overlap", await page.evaluate(() => { const card = document.querySelector('.geo-map [role=alert], .geo-map [role=status]'); if(!card) return null; const cb=card.getBoundingClientRect(); const mb=document.querySelector("div.leaflet-container").getBoundingClientRect(); return { cardInsideMap: cb.top < mb.bottom && cb.bottom > mb.top, cardTop: Math.round(cb.top-mb.top), mapH: Math.round(mb.height) }; }));
  mode = "ok"; await retry.first().focus(); log("focus", await focusDesc(page)); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  log("after retry (loading?)", await page.evaluate(()=>!!document.querySelector(".geo-map .z-sticky")), "focus", await focusDesc(page));
  await page.waitForTimeout(6000);
  log("recovered: card?", await retry.count(), "chip?", await page.evaluate(()=>!!document.querySelector(".geo-map .z-sticky")));
  await shot(page, "map-editor__tiles-recovered", vp);
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,500)); } });
