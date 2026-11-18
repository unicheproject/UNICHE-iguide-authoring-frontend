import { open, go } from "../../../tools/session.mjs";
const D = "ux-audit/round-2/implementation/P3a/after";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of ["pois", "places", "routes"]) {
    await go(page, `/projects/${P}/${k}`); await page.waitForTimeout(3000);
    await page.screenshot({ path: `${D}/${k}-${vp}.png` });
    const m = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("tbody tr[data-row-id], [data-row-id]")].map((r) => r.getBoundingClientRect().height).sort((a, b) => a - b);
      const t = document.querySelector("table")?.getBoundingClientRect();
      return { n: rows.length, median: rows[Math.floor(rows.length / 2)], tableH: t && Math.round(t.height), docH: document.documentElement.scrollHeight, scrollW: document.documentElement.scrollWidth, innerW: innerWidth, th: [...document.querySelectorAll("thead th")].map((x) => x.textContent.trim()) };
    });
    console.log(vp, k, JSON.stringify(m));
  }
  await browser.close();
}
