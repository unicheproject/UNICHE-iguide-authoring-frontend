import { open, go, PID, shot, listReady } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${PID}/pois`); await listReady(page);
const t0 = Date.now();
await page.getByLabel("Needs translation").check();
await page.waitForTimeout(1500);
console.log("url", page.url());
console.log((await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,900));
await shot(page, "pois-list__needs-translation-no-lang");
// choose lang in search in
await page.getByLabel("Search in").selectOption({ label: "Italiano" });
await page.waitForTimeout(1500);
console.log("url", page.url());
console.log((await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0,1200));
await shot(page, "pois-list__needs-translation-italian");
// count rows & footer
console.log("rows", await page.locator("main [role=row], main tbody tr, main li").count());
const foot = await page.locator("main").innerText();
console.log(foot.slice(-400));
console.log("ms worklist", Date.now()-t0);
await browser.close();
