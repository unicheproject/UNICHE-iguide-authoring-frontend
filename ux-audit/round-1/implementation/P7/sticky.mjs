import { open, go } from "../../../tools/session.mjs";
const href = process.argv[2];
for (const vp of ["1280", "768", "zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, href); await page.waitForTimeout(2500);
  await page.evaluate(() => { const m = document.getElementById("main"); m.scrollTop = 420; window.scrollTo(0, 420); document.scrollingElement.scrollTop = 420; });
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => { const i = document.querySelector("#main figure img"); const b = i?.getBoundingClientRect(); return b ? { y: Math.round(b.y), h: Math.round(b.height), vh: innerHeight } : null; });
  console.log(vp, "after scroll 420:", r);
  await page.screenshot({ path: new URL(`./after/editor-scrolled__${vp}.png`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") });
  await browser.close();
}
