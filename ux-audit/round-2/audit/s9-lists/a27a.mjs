import { open, go, shot, POP, focusDesc, problem } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" }); page.setDefaultTimeout(8000);
// live region while typing
await go(page, `/projects/${POP}/events`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900);
await page.getByLabel("Search", { exact: true }).fill("lecture");
const lv = []; for (let i = 0; i < 6; i++) { await page.waitForTimeout(250); lv.push(await page.locator("[role=status]").allTextContents().then((a) => a.join("|"))); }
console.log("live after typing:", JSON.stringify(lv), "rows", await page.locator("tbody tr").count());
await page.getByRole("checkbox", { name: "Featured only" }).check(); await page.waitForTimeout(700);
console.log("live after toggle:", await page.locator("[role=status]").allTextContents());
// Translation sort order
await go(page, `/projects/${POP}/pois?sort=translations`); await page.waitForTimeout(900);
console.log("translations sort asc first dots:", await page.locator("tbody tr").evaluateAll((r) => r.slice(0, 4).concat(r.slice(-2)).map((x) => x.innerText.replace(/\s+/g, " ").match(/English[^]*$/)?.[0].slice(0, 80))));
await browser.close();
