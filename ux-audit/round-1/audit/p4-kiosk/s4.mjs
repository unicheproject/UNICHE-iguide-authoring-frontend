import { open, go, P, shot, small } from "./lib.mjs";
const log = (...a) => console.log(...a);
const FRIEZE = "546c5177-effd-49c8-acae-85d751f89bbe";
for (const vp of ["1024","768"]) {
  const { browser, context, page } = await open("curator", { viewport: vp, touch: true });
  // QR deep link in new tab
  await go(page, `/projects/${P}/app-preview?surface=KIOSK&lang=en&mode=WORKING&t=frieze-101`); await page.waitForTimeout(2000);
  await shot(page, `apppreview__qr-t__${vp}`);
  await go(page, `/projects/${P}/app-preview?surface=KIOSK&lang=en&mode=WORKING&t=nope-999`); await page.waitForTimeout(1500);
  await shot(page, `apppreview__qr-unknown__${vp}`);
  await go(page, `/projects/${P}/app-preview?surface=MOBILE&lang=el&mode=LIVE`); await page.waitForTimeout(1500);
  await shot(page, `apppreview__mobile-el-live__${vp}`);
  // lists
  for (const [n, path] of [["pois","pois"],["places","places"],["maps","maps"]]) {
    await go(page, `/projects/${P}/${path}`); await page.waitForTimeout(1500);
    await shot(page, `list-${n}__touch__${vp}`);
    log(vp, n, "SMALL(main)", JSON.stringify((await small(page, "main")).filter((s,i,a)=>a.indexOf(s)===i).slice(0,40)));
  }
  // POI editor
  await go(page, `/projects/${P}/pois/${FRIEZE}`); await page.waitForTimeout(2000);
  await shot(page, `poi-editor__top-touch__${vp}`);
  log(vp, "poi editor SMALL main", JSON.stringify((await small(page, "main")).slice(0,60)));
  // sticky coverage: scroll and screenshot header actions
  await page.mouse.wheel(0, 1500); await page.waitForTimeout(400); await shot(page, `poi-editor__scrolled-touch__${vp}`);
  const pl = page.getByText("Placement", {exact:true}).first(); await pl.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  await shot(page, `poi-editor__placement-touch__${vp}`);
  await browser.close();
}
