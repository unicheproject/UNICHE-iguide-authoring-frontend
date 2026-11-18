import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, R.pois);
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
// Italian: copy title, fill rest; Practical details
await page.getByRole("tab",{name:/Italiano/}).click();
await page.waitForTimeout(500);
await page.getByRole("button",{name:/Copy source for Title/}).click();
await page.locator("#f-summary").fill("Breve riassunto della scultura di prova.");
await page.locator("#f-description").fill("Primo paragrafo della descrizione.\nSecondo paragrafo, più lungo, da tradurre.");
await page.getByRole("button",{name:/Practical details/}).click();
await page.waitForTimeout(500);
await shot(page,"poi-editor__it-practical-open__1440",true);
console.log(await page.evaluate(()=>[...document.querySelectorAll("main textarea,main input")].filter(e=>e.offsetParent).map(e=>e.id+"|"+(e.labels?.[0]?.innerText||"")).join("\n")));
await browser.close();
