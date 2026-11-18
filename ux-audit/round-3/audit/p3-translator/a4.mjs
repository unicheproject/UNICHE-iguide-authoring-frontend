import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of ["pois","places","categories"]) {
await go(page, base + "/"+k);
await page.waitForSelector("h1"); await page.waitForTimeout(1200);
const t0=Date.now();
await page.getByRole("button", { name: /filters/i }).first().click();
// Search in is first combobox/select
const trig = page.getByRole("combobox").first();
console.log(k,"combobox count", await page.getByRole("combobox").count(), "first:", await trig.innerText().catch(()=>"?"));
await trig.selectOption("it");
await page.waitForTimeout(500);
await shot(page, `${k}-list__search-in-italiano__1440`);
await page.getByRole("checkbox", { name: /needs translation/i }).click();
await page.waitForTimeout(1200);
console.log(k, "url", page.url().replace(base,""), "ms", Date.now()-t0);
await shot(page, `${k}-list__italian-worklist__1440`);
const body = await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,500));
console.log(body);
}
await browser.close();
