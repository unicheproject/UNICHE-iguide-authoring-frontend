import { open, go, P, ready, shot, loadList } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await loadList(page, `/projects/${P}/pois`);
console.log(await page.evaluate(() => [...document.querySelectorAll("main thead th")].map(t => t.getAttribute("aria-sort")+"|"+t.innerHTML.slice(0,300))));
await browser.close();
