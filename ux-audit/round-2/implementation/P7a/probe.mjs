// node probe.mjs <viewport> <query> [shot-name]  (Windows Node). Overlap probe on the Media list view.
import { open, go } from "../../../tools/session.mjs";
const [vp = "1440", query = "?view=list", shot] = process.argv.slice(2);
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/media${query}`);
await page.waitForSelector("table, ul[aria-label='Media files']", { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(1500);
const r = await page.evaluate(() => {
  const out = { overlaps: [], cols: [], count: document.querySelector("[data-media-count]")?.textContent?.trim(), url: location.search, hscroll: document.documentElement.scrollWidth > innerWidth };
  const tbl = document.querySelector("table");
  if (tbl) {
    out.cols = [...tbl.querySelectorAll("thead th")].map((th) => `${th.textContent.trim()}:${Math.round(th.getBoundingClientRect().width)}`);
    for (const tr of [...tbl.querySelectorAll("tbody tr")].slice(0, 12)) {
      const boxes = [...tr.querySelectorAll("td > *, td")].map((e) => [e, e.getBoundingClientRect()]);
      const tds = [...tr.children].map((td) => td.getBoundingClientRect());
      for (let i = 0; i < tds.length; i++) {
        const td = tr.children[i];
        if (td.scrollWidth > td.clientWidth + 1) out.overlaps.push(`cell ${i} overflows ${td.scrollWidth}>${td.clientWidth}`);
      }
    }
  }
  return out;
});
console.log(JSON.stringify(r));
if (shot) await page.screenshot({ path: `after/${shot}.png` });
await browser.close();
