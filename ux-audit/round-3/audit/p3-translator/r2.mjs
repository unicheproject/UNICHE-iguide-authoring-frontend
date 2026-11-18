import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const A = readFileSync("ux-audit/round-3/audit/p3-translator/asset.txt","utf8").trim();
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base+"/guides");
await page.waitForSelector("h1"); await page.waitForTimeout(1500);
await page.getByPlaceholder(/Search/).first().fill("مرحبا");
await page.waitForTimeout(1800);
console.log(await page.evaluate(()=>{ const a=document.querySelector("tbody tr a"); const chain=[]; let e=a; while(e&&e!==document.documentElement){chain.push(e.tagName+"[dir="+e.getAttribute("dir")+",lang="+e.getAttribute("lang")+"]"); e=e.parentElement;} return "html dir="+document.documentElement.dir+" lang="+document.documentElement.lang+"\n"+chain.slice(0,6).join(" < ")+"\nrow: "+document.querySelector("tbody tr").innerHTML.slice(0,500)}));
await shot(page,"guides-list__rtl-row__1440");
await go(page, A);
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
await page.locator("#f-alternativeText").fill("صورة اختبار متدرجة الألوان من الأزرق إلى الوردي (2026).");
await page.waitForTimeout(300);
console.log(await page.evaluate(()=>{const e=document.querySelector("#f-alternativeText"); return `alt dir=${e.getAttribute("dir")} lang=${e.lang} computed=${getComputedStyle(e).direction}`}));
await shot(page,"asset-editor__rtl-alt-text__1440");
// do not save; discard by navigating away
await browser.close();
