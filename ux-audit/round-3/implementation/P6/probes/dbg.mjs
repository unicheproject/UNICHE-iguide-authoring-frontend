import { go, POP, MAP, run, log, start, focusDesc, shot } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await start("1440");
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(3500);
  await page.evaluate(() => { window.__said = []; new MutationObserver(() => { for (const l of document.querySelectorAll("[aria-live]")) if (l.textContent.trim()) window.__said.push(l.textContent.trim()); }).observe(document.body, { subtree: true, childList: true, characterData: true }); });
  await page.evaluate(() => document.querySelector(".geo-map").scrollIntoView({ block: "center" }));
  await page.locator(".leaflet-control-zoom-in").click(); await page.waitForTimeout(900);
  await page.locator(".leaflet-control-zoom-in").focus(); await page.keyboard.press("-"); await page.waitForTimeout(900);
  log("SAID", await page.evaluate(() => [...new Set(window.__said)]));
  // tile failure
  await page.route(/tiles\.openfreemap\.org|tile\.openstreetmap\.org/, r => r.abort());
  await go(page, `/projects/${POP}/maps/${MAP}`); await page.waitForTimeout(6000);
  log("card", await page.locator('[role=alert]:has-text("map background")').count());
  log("card box", await page.evaluate(() => { const c = [...document.querySelectorAll('[role=alert]')].find(a => /map background/.test(a.textContent)); const m = document.querySelector(".leaflet-container"); if (!c) return null; const b = c.getBoundingClientRect(), r = m.getBoundingClientRect(); return { cardY: Math.round(b.y - r.y), cardH: Math.round(b.height), inside: b.bottom <= r.bottom && b.x >= r.x, mapH: Math.round(r.height) }; }));
  await shot(page, "map-editor__tiles-failed", "1440");
  const retry = page.getByRole("button", { name: "Try again" }); await retry.focus();
  log("focus before", await focusDesc(page));
  await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  log("focus after retry", await focusDesc(page));
  await browser.close();
});
