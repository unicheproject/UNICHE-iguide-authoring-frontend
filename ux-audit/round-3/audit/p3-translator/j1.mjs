import { open, go, base, shot } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base+"/pois?lang=it&missing=it"); await page.waitForSelector("tbody tr"); await page.waitForTimeout(1500);
const row = page.locator("tbody tr").first();
const name = (await row.locator("a").first().innerText()).trim();
await row.getByRole("link",{name:/Italiano/}).click();
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
console.log("after dot click:", page.url().split("pois/")[1].slice(36), "| active tab:", await page.evaluate(()=>document.querySelector("[role=tab][aria-selected=true]").innerText.replace(/\s+/g," ")), "| focus:", await page.evaluate(()=>document.activeElement.tagName+"#"+document.activeElement.id+" "+(document.activeElement.innerText||"").slice(0,30)));
// breadcrumb back
await page.getByRole("link",{name:"Points of Interest"}).first().click();
await page.waitForTimeout(1800);
console.log("breadcrumb back url:", page.url().split("pois")[1], "| rows", await page.locator("tbody tr").count());
await page.goBack(); await page.waitForTimeout(1200);
await page.goBack(); await page.waitForTimeout(1500);
console.log("history back url:", page.url().split("pois")[1]);
// title link
const row2 = page.locator("tbody tr").first();
await row2.locator("a").first().click();
await page.waitForSelector("h1"); await page.waitForTimeout(1500);
console.log("title click ->", page.url().split("pois/")[1].slice(36)||"(no lang)", "| active tab:", await page.evaluate(()=>document.querySelector("[role=tab][aria-selected=true]").innerText.replace(/\s+/g," ")));
await browser.close();
