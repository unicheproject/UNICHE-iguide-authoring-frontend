import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
const foc = ()=>page.evaluate(()=>{const e=document.activeElement; return `${e.tagName}#${e.id} role=${e.getAttribute("role")} "${(e.getAttribute("aria-label")||e.innerText||e.value||"").trim().replace(/\s+/g," ").slice(0,50)}" selected=${e.getAttribute("aria-selected")}`});
await go(page, R.categories+"?lang=el");
await page.waitForSelector("h1"); await page.waitForTimeout(2000);
// focus the Greek tab
await page.locator("#tab-el").focus();
console.log("tab focus:", await foc());
await page.keyboard.press("ArrowRight"); await page.waitForTimeout(300);
console.log("ArrowRight:", await foc(), "| url", page.url().split("?")[1]);
await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(300);
console.log("ArrowLeft x2:", await foc());
await page.keyboard.press("Home"); await page.keyboard.press("End"); await page.waitForTimeout(200);
console.log("End:", await foc());
await page.keyboard.press("Tab"); await page.waitForTimeout(200);
console.log("Tab from tab:", await foc());
// Next missing
await page.getByRole("button",{name:/Next missing/}).last().focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(800);
console.log("after Next missing:", await foc());
console.log("live:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live],[role=status]")].map(e=>e.innerText.trim()).filter(Boolean).join(" || ")));
console.log("tabs:", await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," ")+"/"+t.getAttribute("aria-selected")).join(" ; ")));
await shot(page,"category-editor__after-next-missing__1440");
// Greek: lang attribute on text fields, copy-source focus
console.log(await page.evaluate(()=>[...document.querySelectorAll("#f-name,#f-description,[id$=-source]")].map(e=>e.id+" lang="+e.lang+" dir="+e.dir).join("; ")));
await browser.close();
