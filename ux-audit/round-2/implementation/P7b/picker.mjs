import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url.replace("ux-audit/round-2/implementation/P7b/picker.mjs","package.json"));
const { AxeBuilder } = require("@axe-core/playwright");
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const out = "ux-audit/round-2/implementation/P7b/after/";
for (const vp of ["1440","1024","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois`);
  await page.waitForSelector("main a[href*='/pois/']", { timeout: 30000 });
  await page.locator("main a[href*='/pois/']").first().click();
  await page.waitForSelector("button[data-slot]", { timeout: 40000 });
  await page.waitForTimeout(800);
  const btn = page.locator("button[data-slot]").first();
  await btn.scrollIntoViewIfNeeded(); await btn.click();
  await page.waitForSelector("[role=dialog] button[data-asset-id], [role=dialog] [data-asset-id]", { timeout: 15000 });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => {
    const d = document.querySelector("[role=dialog]");
    const body = d.querySelector("[data-dialog-body]");
    const tiles = [...d.querySelectorAll("button[data-asset-id]")];
    const vis = tiles.filter(t => { const r = t.getBoundingClientRect(), b = body.getBoundingClientRect(); return r.bottom > b.top && r.top < b.bottom; }).length;
    const rows = new Set(tiles.filter(t => { const r = t.getBoundingClientRect(), b = body.getBoundingClientRect(); return r.bottom > b.top+10 && r.top < b.bottom-10; }).map(t => Math.round(t.getBoundingClientRect().top))).size;
    return { tiles: tiles.length, visibleTiles: vis, visibleRows: rows, bodyH: Math.round(body.getBoundingClientRect().height), vh: innerHeight, tabStops: tiles.filter(t=>t.tabIndex===0).length, alt: d.querySelectorAll("*").length && [...d.querySelectorAll("*")].filter(e=>e.textContent.trim()==="No alt text").length };
  });
  // Tab from search to the grid
  await page.locator("#picker-search").focus();
  let tabs = 0, hit = null;
  for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); tabs++; hit = await page.evaluate(() => document.activeElement?.dataset?.assetId ?? null); if (hit) break; }
  const first = hit;
  await page.keyboard.press("ArrowRight"); const a1 = await page.evaluate(() => document.activeElement?.dataset?.assetId);
  await page.keyboard.press("ArrowDown"); const a2 = await page.evaluate(() => document.activeElement?.dataset?.assetId);
  await page.keyboard.press("End"); const a3 = await page.evaluate(() => document.activeElement?.dataset?.assetId);
  await page.keyboard.press("Home"); const a4 = await page.evaluate(() => document.activeElement?.dataset?.assetId);
  let after = 0; for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); after++; const inGrid = await page.evaluate(() => !!document.activeElement?.dataset?.assetId); if (!inGrid && i===0) break; }
  console.log(vp, JSON.stringify({ ...info, tabsToGrid: tabs, moved: [first, a1, a2, a3, a4].map(x => x?.slice(0,4)), tabAfterGridLeavesGrid: after===1 }));
  await page.screenshot({ path: `${out}picker-${vp}.png` });
  if (vp !== "768") { const ax = await new AxeBuilder({ page }).analyze(); console.log(vp, "axe", ax.violations.filter(v=>["serious","critical"].includes(v.impact)).map(v=>v.id+":"+v.nodes.length)); }
  await browser.close();
}
