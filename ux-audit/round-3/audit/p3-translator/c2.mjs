import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, R.routes);
await page.waitForSelector("h1"); await page.waitForTimeout(1500);
if (!(await page.locator("#f-summary").inputValue())) {
await page.locator("#f-summary").fill("A short test walk past the sculptures.");
await page.locator("#f-description").fill("A test route description in English.");
}
await page.locator("#add-stop").click();
const d = page.locator("[role=dialog]");
await d.locator("input[type=search]").fill("UX-R3-p3 Poi");
await page.waitForTimeout(800);
await d.getByText("UX-R3-p3 Poi", {exact:false}).first().click();
await d.locator("button",{hasText:/Done/}).click();
await page.waitForTimeout(500);
await page.getByRole("button",{name:/^Save/}).first().click();
await page.waitForTimeout(2500);
// default tab: expand stop texts
const more = page.getByText(/More stop texts/).first();
await more.click().catch(e=>console.log("no more link"));
await page.waitForTimeout(500);
console.log("stop fields default:", await page.evaluate(()=>[...document.querySelectorAll("main textarea,main input")].filter(e=>e.offsetParent).map(e=>e.id+"|"+(e.labels?.[0]?.innerText||e.getAttribute("aria-label")||"")).join("\n")));
await shot(page,"route-editor__stop-texts-default__1440",true);
await page.getByRole("tab",{name:/Ελληνικά/}).click();
await page.waitForTimeout(800);
await shot(page,"route-editor__el-with-stop__1440",true);
console.log("EL:", await page.evaluate(()=>[...document.querySelectorAll("main textarea,main input,main button")].filter(e=>e.offsetParent).map(e=>e.tagName+" "+e.id+"|"+(e.labels?.[0]?.innerText||e.getAttribute("aria-label")||e.innerText||"").trim().replace(/\s+/g," ").slice(0,60)).join("\n")));
await browser.close();
