import { open, go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
import { readFileSync } from "node:fs";
const MAP = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url))).map;
const vp = process.argv[2] || "1440";
await run(async () => { try {
  const { browser, page } = await start(vp); log("=== c2 placement", vp);
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(2500);
  // focus ring crop of a handle
  await page.getByRole("button", { name: "Edit bounds" }).click(); await page.waitForTimeout(1200);
  const reg = page.locator('div.leaflet-container[aria-label=Map]');
  await reg.scrollIntoViewIfNeeded();
  const h = page.locator('.leaflet-marker-icon[aria-label^="North-east"]');
  await h.focus(); await page.waitForTimeout(200);
  const bb = await h.boundingBox();
  await page.screenshot({ path: `ux-audit/round-3/audit/s12-maps/shots/map-editor__handle-ne-focus-crop__${vp}.png`, clip: { x: Math.max(0,bb.x-60), y: Math.max(0,bb.y-40), width: 160, height: 100 } });
  const c = page.locator('.leaflet-marker-icon[aria-label^="Centre"]'); await c.focus();
  const cb = await c.boundingBox();
  await page.screenshot({ path: `ux-audit/round-3/audit/s12-maps/shots/map-editor__handle-centre-focus-crop__${vp}.png`, clip: { x: cb.x-60, y: cb.y-40, width: 160, height: 100 } });
  log("focus styles", await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); const i = a.firstElementChild; return { tag: a.className, outline: cs.outlineStyle+" "+cs.outlineWidth+" "+cs.outlineColor, inner: i ? i.className + " | " + getComputedStyle(i).boxShadow + " | " + getComputedStyle(i).outline : null }; }));
  await page.getByRole("button", { name: /Done editing bounds/ }).click(); await page.waitForTimeout(500);
  // Placement: 6 unplaced
  const placeBtns = page.locator('#placed button:has-text("Place")');
  log("unplaced buttons", await placeBtns.count());
  log("first names", await placeBtns.evaluateAll(b => b.slice(0,6).map(x => x.textContent.trim())));
  const m0 = await page.locator("main").innerText().catch(()=>"");
  for (let i = 0; i < 6; i++) { await page.locator('#placed ul button').first().click(); await page.waitForTimeout(150); }
  await page.waitForTimeout(800);
  log("placed count heading", await page.locator("#placed h3").allInnerTexts());
  await reg.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  await shot(page, "map-editor__placed-six", vp);
  log("pins", await page.evaluate(() => { const r = document.querySelector('div.leaflet-container[aria-label=Map]').getBoundingClientRect(); return [...document.querySelectorAll('div.leaflet-container[aria-label=Map] .leaflet-marker-icon')].filter(m=>!/of the area/.test(m.getAttribute("aria-label")||"")).map(m => { const b = m.getBoundingClientRect(); return { l: (m.getAttribute("aria-label")||"").slice(0,70), x: Math.round(b.x-r.x), y: Math.round(b.y-r.y), w: Math.round(b.width), h: Math.round(b.height), tab: m.getAttribute("tabindex") }; }); }));
  log("Placed list", await page.locator("#placed ol li").evaluateAll(l => l.slice(0,8).map(x => x.innerText.replace(/\n+/g," | "))));
  // Place inputs: valid? note coordinates of the first placement
  const lat0 = page.locator("#pl-0-lat"), lng0 = page.locator("#pl-0-lng");
  log("pl0", await lat0.inputValue(), await lng0.inputValue());
  // Out of bounds + invalid values by blur
  const probes = [["lat","abc"],["lat","95"],["lat","38,5"],["lng","12,5"],["lng","200"],["lat","37,9770"],["lng","23,7150"]];
  for (const [k, v] of probes) {
    const f = page.locator(`#pl-0-${k}`); await f.fill(v); await f.press("Tab"); await page.waitForTimeout(300);
    log("PROBE", k, v, "invalid:", await f.getAttribute("aria-invalid"), "err:", await page.locator("#placed").evaluate((el) => [...el.querySelectorAll('[id$="-error"],[id$="-err"],.text-danger')].map(e=>e.textContent.trim()).join(" || ")), "outsideAlert:", await page.locator('[role=alert]:has-text("outside the bounds"), .alert:has-text("outside the bounds")').allInnerTexts());
    if (v === "38,5") { await shot(page, "map-editor__out-of-bounds", vp); }
    if (v === "abc") { await shot(page, "map-editor__blur-letters", vp); }
  }
  log("LIVE", await page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map(l => l.textContent.slice(0,150))));
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,500)); } });
