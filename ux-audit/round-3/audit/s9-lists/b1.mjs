import { open, go, P, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of ["pois","places","categories"]) {
await go(page, `/projects/${P}/${k}`); await settle(page, 2000);
console.log(k, await page.evaluate(() => document.querySelectorAll("main table tbody tr")[2].outerHTML.replace(/<svg.*?<\/svg>/g,"<svg/>").replace(/ data-v-[a-z0-9]+=""/g,"")));
}
await browser.close();
