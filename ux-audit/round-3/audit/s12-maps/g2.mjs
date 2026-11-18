import { go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
await run(async () => { try {
  const { browser, page } = await start("1440"); log("=== g2 geopicker");
  await go(page, `/projects/${POP}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await page.waitForTimeout(3000);
  log("h1", await page.locator("h1").allInnerTexts(), "buttons", await page.locator("main button").evaluateAll(b=>b.map(x=>x.innerText.trim()).filter(t=>/position|map|location|place/i.test(t))));
  const eb = page.getByRole("button", { name: /edit position|set position|position|location/i }).first();
  if (await eb.count()) { await eb.click(); await page.waitForTimeout(2500); }
  log("maps", await page.locator("div.leaflet-container").count());
  const reg = page.locator("div.leaflet-container").first(); await reg.scrollIntoViewIfNeeded(); await shot(page, "poi-geopicker__default", "1440");
  log("skip", await page.locator("a, button").evaluateAll(b=>b.map(x=>x.innerText.trim()).filter(t=>/skip/i.test(t))));
  await reg.focus(); const st=[]; for (let i=0;i<12;i++){ await page.keyboard.press("Tab"); st.push(await focusDesc(page)); } log("geopicker tabs", st);
  log("map section text", await page.locator("section:has(div.leaflet-container)").first().innerText().then(t=>t.slice(0,700).replace(/\n+/g," | ")));
  await page.goto(`http://localhost:5173/projects/${POP}/routes`); await page.waitForTimeout(1500);
  const rh = await page.locator('main a[href*="/routes/"]').first().getAttribute("href"); await go(page, rh); await page.waitForTimeout(3000);
  await page.locator("div.leaflet-container").first().scrollIntoViewIfNeeded(); await shot(page, "route-map__default", "1440");
  log("route map section", await page.locator("section:has(div.leaflet-container)").first().innerText().then(t=>t.slice(0,600).replace(/\n+/g," | ")));
  await axe(page, "route map");
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,600)); } });
