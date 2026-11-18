import { open, go } from "../tools/session.mjs";
const { browser, page } = await open("admin");
await go(page, "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois");
await page.waitForTimeout(5000);
console.log("title:", await page.title());
console.log("h1:", await page.locator("h1").first().innerText().catch(e=>"none"));
console.log("rows:", await page.locator("tbody tr").count());
await browser.close();
