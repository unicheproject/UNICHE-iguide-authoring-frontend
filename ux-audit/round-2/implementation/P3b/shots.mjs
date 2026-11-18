import { open, go } from "../../../tools/session.mjs";
const D = "ux-audit/round-2/implementation/P3b/after";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
for (const kind of ["guides", "events", "categories"]) {
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("admin", { viewport: vp });
    await go(page, `/projects/${P}/${kind}`); await page.waitForTimeout(3000);
    await page.screenshot({ path: `${D}/${kind}-${vp}.png` });
    const m = await page.evaluate(() => ({
      th: [...document.querySelectorAll("thead th")].map((t) => [t.textContent.trim(), Math.round(t.getBoundingClientRect().height), Math.round(t.getBoundingClientRect().width)]),
      rowH: Math.round(document.querySelector("tbody tr")?.getBoundingClientRect().height ?? 0),
      rows: document.querySelectorAll("tbody tr").length,
      first: document.querySelector("tbody tr")?.innerText.replace(/\n/g, " | "),
      scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
    }));
    console.log(kind, vp, JSON.stringify(m));
    await browser.close();
  }
}
