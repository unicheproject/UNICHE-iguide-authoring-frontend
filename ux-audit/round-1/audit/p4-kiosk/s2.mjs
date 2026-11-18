import { open, go, P, shot, small } from "./lib.mjs";
const log = (...a) => console.log(...a);
for (const vp of ["1024","768"]) {
  const { browser, context, page } = await open("curator", { viewport: vp, touch: true });
  await go(page, `/projects/${P}/preview`); await page.waitForTimeout(1500);
  await shot(page, `preview__default-touch__${vp}`);
  log(vp, "SMALL preview", JSON.stringify(await small(page), null, 0));
  await page.getByRole("button", { name: /^kiosk$/i }).tap(); await page.waitForTimeout(500);
  await shot(page, `preview__KIOSK-touch__${vp}`, true);
  log(vp, "frame metrics", await page.evaluate(() => { const f=[...document.querySelectorAll("[role=tabpanel],[aria-label^=Preview]")].map(e=>{const r=e.getBoundingClientRect();return [e.getAttribute("aria-label"),Math.round(r.width),Math.round(r.height)]}); return JSON.stringify(f)+" scrollW "+document.documentElement.scrollWidth; }));
  // scroll inside the page with touch swipe, check sticky
  await page.mouse.wheel(0, 600); await page.waitForTimeout(300); await shot(page, `preview__scrolled-touch__${vp}`);
  log(vp, "small in frame", JSON.stringify(await small(page, "[aria-label^=Preview]")));
  // tap a tile in the frame
  const tile = page.getByRole("button", { name: /Points of interest/i }).first(); 
  if (await tile.count()) { await tile.tap(); await page.waitForTimeout(500); await shot(page, `preview__kiosk-poilist-touch__${vp}`); }
  // open new tab
  await page.evaluate(()=>window.scrollTo(0,0));
  const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: /open in new tab/i }).tap()]);
  await popup.waitForLoadState("networkidle").catch(()=>{}); await popup.waitForTimeout(1500);
  log(vp, "popup url", popup.url());
  await popup.screenshot({ path: `ux-audit/round-1/audit/p4-kiosk/shots/apppreview__newtab__${vp}.png` });
  log(vp, "SMALL apppreview", JSON.stringify(await small(popup)));
  await browser.close();
}
// 768x600 reduced height
{
  const { browser, page } = await open("curator", { viewport: "768", touch: true });
  await page.setViewportSize({ width: 768, height: 600 });
  await go(page, `/projects/${P}/preview`); await page.waitForTimeout(1500);
  await shot(page, `preview__kbd-height__768x600`);
  await browser.close();
}
