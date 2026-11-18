import { session, go, P, ids, LOG, shot, ax, sleep, AFTER } from "./h.mjs";
const log = LOG("kb");
{
  const { browser, page } = await session({ viewport: "1440" });
  await go(page, P(`/routes/${ids.routeEmpty}`));
  await page.getByRole("button", { name: "Add stops" }).waitFor(); await sleep(1200);
  await page.getByRole("button", { name: "Add stops" }).focus();
  await page.keyboard.press("Enter"); await sleep(500);
  log("dialog focus", await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName));
  await page.keyboard.type("parthenon"); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await sleep(400);
  log("after Enter on ArrowDown row, added rows", await page.locator("[role=dialog] [aria-disabled=true]").count());
  await page.keyboard.press("Escape"); await sleep(500);
  log("after Esc focus", await page.evaluate(() => (document.activeElement?.textContent || document.activeElement?.tagName).trim().slice(0, 40)));
  const links = await page.evaluate(() => [...document.querySelectorAll("#stops ul li a")].map((a) => { const r = a.getBoundingClientRect(); return { t: a.textContent.trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; }));
  log("unplaced link boxes", links);
  await browser.close();
}
{
  const { browser, page } = await session({ viewport: "1440", forcedColors: "active" });
  await go(page, P(`/routes/${ids.route}`));
  await page.waitForSelector(".leaflet-marker-icon", { timeout: 25000 }); await sleep(1500);
  await page.evaluate(() => document.getElementById("stops").scrollIntoView({ block: "start" })); await sleep(600);
  await page.screenshot({ path: AFTER + "/route-stops-forced-1440.png" });
  await browser.close();
}
{
  const { browser, page } = await session({ viewport: "zoom200" });
  await go(page, P(`/guides/${ids.guide}`));
  await page.getByRole("button", { name: "Add paragraph" }).waitFor(); await sleep(1200);
  await page.getByRole("button", { name: "Add heading" }).click(); await page.keyboard.type("Ένας τίτλος"); await sleep(300);
  await page.evaluate(() => document.getElementById("story").scrollIntoView()); await sleep(400);
  await page.screenshot({ path: AFTER + "/guide-zoom200.png" });
  log("zoom200 axe", await ax(page));
  await browser.close();
}
