import { session, go, P, ids, LOG, shot, sleep, AE, names, stickyStack } from "./h.mjs";
const log = LOG("b5");
const cases = [["1440", {}], ["1280", {}], ["1024", { touch: true }], ["zoom200", {}]];
for (const [vp, opts] of cases) {
  const { browser, page } = await session({ viewport: vp, ...opts });
  await go(page, P(`/pois/${ids.wc1}`));
  await page.waitForSelector("#f-summary", { timeout: 20000 });
  await page.locator("#f-summary").fill("dirty text " + vp);
  await sleep(500);
  const appH = await page.evaluate(() => Math.round(document.querySelector("header").getBoundingClientRect().bottom));
  // at top (not scrolled)
  const topNames = (await names(page)).filter((n) => /Save draft|Save and apply|Apply changes/.test(n));
  log(vp, "at top: buttons", topNames);
  const st = await stickyStack(page);
  const chrome = st.chrome;
  log(vp, `scrolled: chrome (app header ${appH} + sticky) = ${chrome}px = ${(chrome / st.vh * 100).toFixed(1)}% of ${st.vh}`, st.parts.map((p) => `${p.el.slice(0, 30)}:${p.h}`));
  const sn = (await names(page)).filter((n) => /Save draft/.test(n));
  log(vp, "scrolled: Save draft in tree:", sn.length, "visible banner save:", await page.evaluate(() => { const b = document.querySelector("[data-banner-save]"); return b ? getComputedStyle(b).display : "none-absent"; }), "header save:", await page.locator("[data-header-save]").count());
  // is the Save draft visible within the viewport (touch case)
  const vis = await page.evaluate(() => { const b = document.querySelector("[data-header-save]") ?? document.querySelector("[data-banner-save]"); const r = b?.getBoundingClientRect(); return r ? { top: Math.round(r.top), inView: r.top >= 0 && r.bottom <= innerHeight } : null; });
  log(vp, "Save draft position:", vis);
  await shot(page, `b5-scrolled-${vp}`);
  // scroll to top, tab from title to Save draft
  await page.evaluate(() => { const m = document.getElementById("main"); (m && m.scrollHeight > m.clientHeight ? m : document.scrollingElement).scrollTo(0, 0); });
  await sleep(300);
  await page.locator("#main h1").first().focus().catch(() => {});
  let reach = -1;
  for (let i = 1; i <= 30; i++) { await page.keyboard.press("Tab"); const a = await AE(page); if (/Save draft/.test(a)) { reach = i; break; } }
  log(vp, "Tab presses from title to Save draft:", reach);
  await shot(page, `b5-top-${vp}`);
  await browser.close();
}
