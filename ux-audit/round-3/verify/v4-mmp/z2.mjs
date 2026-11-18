import { go, POP, run, log, start } from "./lib.mjs";
const MAP = "9fda753d-4d8e-4fba-9760-f300253e2060";
await run(async () => {
  const { page } = await start("1440");
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForSelector(".leaflet-container"); await page.waitForTimeout(4000);
  await page.evaluate(() => { window.__m = []; const t0=performance.now(); new MutationObserver(ms => ms.forEach(m => { const el = m.target.nodeType===3?m.target.parentElement:m.target; if (/Zoom/.test(el?.textContent||"") && el.closest("[aria-live],[role=status]")) window.__m.push(Math.round(performance.now()-t0)+":"+el.closest("[aria-live],[role=status]").textContent.trim().slice(0,40)); })).observe(document.body,{childList:true,characterData:true,subtree:true}); });
  await page.evaluate(() => document.querySelector(".leaflet-container").scrollIntoView({ block: "center" }));
  const st = () => page.evaluate(() => [...document.querySelectorAll(".leaflet-control-zoom a")].map(a=>a.getAttribute("aria-label")+":"+a.getAttribute("aria-disabled")));
  log("start", await st(), "scale", await page.evaluate(()=>document.querySelector(".maplibregl-canvas")?.style.width));
  for (let i=0;i<3;i++){ await page.locator(".leaflet-control-zoom-in").click(); await page.waitForTimeout(1500); log("after +", i, await st(), await page.evaluate(()=>window.__m.splice(0))); }
  for (let i=0;i<2;i++){ await page.locator(".leaflet-control-zoom-out").click(); await page.waitForTimeout(1500); log("after -", i, await st(), await page.evaluate(()=>window.__m.splice(0))); }
});
