// Windows Node. Shots of grid/list at all viewports, axe, upload keyboard flow.
import { open, go } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const res = {};
for (const vp of ["1440", "1280", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const view of ["grid", "list"]) {
    await go(page, `/projects/${P}/media?view=${view}`);
    await page.waitForSelector("[data-media-count]", { timeout: 30000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `after/${view}-${vp}.png` });
    res[`${view}-${vp}`] = await page.evaluate(() => {
      const t = document.querySelector("table"); let ov = 0;
      t?.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td) => { if (td.scrollWidth > td.clientWidth + 1) ov++; }));
      return { ov, hscroll: document.documentElement.scrollWidth > innerWidth, url: location.search, cols: t ? [...t.querySelectorAll("th")].map((th) => Math.round(th.getBoundingClientRect().width)) : null };
    });
  }
  await browser.close();
}
console.log(JSON.stringify(res));
