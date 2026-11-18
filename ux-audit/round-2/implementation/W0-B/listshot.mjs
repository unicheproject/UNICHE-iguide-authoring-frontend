import { open, go } from "../../../tools/session.mjs";
const tag = process.argv[2]; const vp = process.argv[3] ?? "1280";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1500);
await page.evaluate(() => (document.getElementById("main").scrollTop = 300)); await page.waitForTimeout(300);
const m = await page.evaluate(() => {
  const main = document.getElementById("main"); const mt = main.getBoundingClientRect().top;
  const bars = [...main.querySelectorAll("*")].filter((e) => getComputedStyle(e).position === "sticky").map((e) => { const r = e.getBoundingClientRect(); return { c: e.className.toString().slice(0, 30), top: Math.round(r.top - mt), bottom: Math.round(r.bottom - mt) }; });
  const th = main.querySelector("thead th"); const rows = [...main.querySelectorAll("tbody tr")].slice(0, 6).map((r) => { const b = r.getBoundingClientRect(); return { top: Math.round(b.top - mt), bottom: Math.round(b.bottom - mt) }; });
  return { vh: innerHeight, bars, thBottom: th ? Math.round(th.getBoundingClientRect().bottom - mt) : null, rows, prop: getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h") };
});
console.log(JSON.stringify(m));
await page.screenshot({ path: `${tag}/poi-list-${vp}.png` });
await browser.close();
