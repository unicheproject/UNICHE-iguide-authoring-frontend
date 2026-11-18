import { open, go, P, settle, shot, focusDesc, save } from "./h.mjs";
const res = {};
const rowStats = (page) => page.evaluate(() => {
  const rows = [...document.querySelectorAll("[data-row-id]")]; const h = rows.map((r) => Math.round(r.getBoundingClientRect().height)).sort((a, b) => a - b);
  return { n: h.length, median: h[Math.floor(h.length / 2)], max: h[h.length - 1], min: h[0] };
});
for (const vp of ["1440", "1280", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of ["places", "pois", "routes"]) {
    await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 800);
    res[`rows-${k}@${vp}`] = await rowStats(page);
    await shot(page, `${k}-populated__${vp}`);
    await go(page, `/projects/${P}/${k}?q=zzzznomatch&status=DRAFT`); await settle(page, 1200);
    await shot(page, `${k}-filtered-empty__${vp}`);
    res[`empty-${k}@${vp}`] = await page.evaluate(() => document.querySelector("main h2")?.parentElement?.innerText.replace(/\n+/g, " | "));
    if (["1440", "1024", "zoom200"].includes(vp)) {
      const pat = new RegExp(`/${k}\\?`);
      await page.route(pat, (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "x", status: 503, code: "UNAVAILABLE", requestId: "req-p3a" }) }));
      await go(page, `/projects/${P}/${k}`); await settle(page, 1500);
      res[`error-${k}@${vp}`] = { focus: await focusDesc(page), card: await page.evaluate(() => document.querySelector("[role=alert]")?.innerText.replace(/\n+/g, " | ")) };
      await shot(page, `${k}-error__${vp}`);
      await page.unroute(pat);
    }
  }
  await browser.close();
}
// long Greek POI and RTL punctuation at 1024 / 1280
{
  const { browser, page } = await open("admin", { viewport: "1280" });
  await go(page, `/projects/${P}/pois?q=UX-R3-P3core`); await settle(page, 1500);
  await shot(page, "pois-greek__1280");
  res.greek1280 = await page.evaluate(() => [...document.querySelectorAll("[data-row-id]")].map((r) => { const a = r.querySelector("a"); return { t: a.textContent.trim().length, lines: Math.round(a.getBoundingClientRect().height / parseFloat(getComputedStyle(a).lineHeight)), bdi: !!a.querySelector("bdi") }; }));
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  for (const k of ["places", "pois", "routes"]) { await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 600); await shot(page, `${k}-forced-colours__1440`); }
  await browser.close();
}
save("shots", res);
console.log(JSON.stringify(res, null, 1));
