import { go, POP, run, log, start } from "./lib.mjs";
const MAP = "9fda753d-4d8e-4fba-9760-f300253e2060";
await run(async () => {
  const { page } = await start("1440");
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForSelector(".leaflet-container"); await page.waitForTimeout(4000);
  await page.evaluate(() => { window.__seen = new Set(); setInterval(() => { document.querySelectorAll("[aria-live],[role=status],[role=alert]").forEach(l => { const t = l.textContent.trim(); if (t) window.__seen.add((l.getAttribute("role")||"live")+":"+t.slice(0,60)); }); }, 30); });
  await page.evaluate(() => document.querySelector(".leaflet-container").scrollIntoView({ block: "center" }));
  const saveDis = () => page.evaluate(() => { const b=[...document.querySelectorAll("button")].find(b=>/^Save$/.test(b.textContent.trim())); return b ? (b.disabled||b.getAttribute("aria-disabled")) : "nobtn"; });
  log("save disabled before", await saveDis());
  const seen = async (l) => { await page.waitForTimeout(1500); log(l, await page.evaluate(() => { const a=[...window.__seen]; window.__seen.clear(); return a; })); };
  await page.locator(".leaflet-control-zoom-in").click(); await seen("click +");
  await page.locator(".leaflet-control-zoom-in").click(); await seen("click + again");
  log("save disabled after zoom", await saveDis());
  await page.locator(".leaflet-container").focus(); await page.keyboard.press("-"); await seen("key -");
  await page.keyboard.press("+"); await seen("key +");
  await page.locator(".leaflet-control-zoom-out").click(); await seen("click -");
  await page.mouse.move(600,500); await page.mouse.wheel(0,-200); await seen("wheel");
  log("live regions", await page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status]")].map(l=>l.tagName+" "+(l.className||"").toString().slice(0,40)+" live="+l.getAttribute("aria-live"))));
});
