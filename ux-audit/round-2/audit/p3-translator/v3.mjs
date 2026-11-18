import { open, go, PID, shot, listReady } from "./lib.mjs";
for (const vp of ["1024", "768", "zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${PID}/pois?missing=it&lang=it`); await listReady(page);
  await shot(page, "pois-list__worklist-it", vp, false);
  const m = await page.evaluate(() => ({ ox: document.documentElement.scrollWidth > innerWidth, toolbarH: Math.round(document.querySelector("main")?.querySelector("[role=search], form, section")?.getBoundingClientRect().height ?? 0) }));
  // vertical offset of first row
  const y = await page.locator("main a[href*='/pois/']").first().evaluate(e => Math.round(e.getBoundingClientRect().top)).catch(() => null);
  console.log(vp, JSON.stringify(m), "first row y:", y, "of viewport h", await page.evaluate(() => innerHeight));
  await browser.close();
}
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${PID}/media?missing=it&lang=it&view=list`); await page.waitForTimeout(5000);
await page.getByRole("button", { name: /^List/ }).click().catch(()=>{}); await page.waitForTimeout(1200);
await shot(page, "media__list-needs-translation-it", "1440", false);
console.log((await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,1200));
await go(page, `/projects/${PID}/media?q=${encodeURIComponent("Ψηφιδωτό")}`); await page.waitForTimeout(5000);
await shot(page, "media__search-greek-title", "1440", false);
console.log((await page.locator("main").innerText()).replace(/\n+/g," | ").slice(450,900));
await browser.close();
