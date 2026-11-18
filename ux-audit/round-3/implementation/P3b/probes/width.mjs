import { open, go, P, settle } from "./h.mjs";
for (const vp of ["1440","1280","1024"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois`);
  await page.waitForSelector("[data-row-id]", { timeout: 20000 }).catch(() => {});
  await settle(page, 500);
  console.log(vp, await page.evaluate(() => { const t = document.querySelector("main table"); return t ? { table: t.getBoundingClientRect().width, ths: [...t.querySelectorAll("th")].map(h => Math.round(h.getBoundingClientRect().width)) } : "no table"; }));
  await browser.close();
}
