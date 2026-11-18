import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base+"/maps/f8daa876-f2af-4552-95ae-431c96ed1b2d"); await page.waitForSelector("h1"); await page.waitForTimeout(3500);
console.log("tabs:", await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," ")).join(" ; ")||"none"));
console.log(await page.evaluate(()=>[...document.querySelectorAll("main label,main legend,main h2")].map(e=>e.innerText.trim().replace(/\s+/g," ").slice(0,40)).join(" | ")));
await shot(page,"map-editor__default__1440");
await go(page, base+"/floor-plans"); await page.waitForSelector("h1"); await page.waitForTimeout(2000);
console.log("floorplans list:", await page.evaluate(()=>document.querySelector("main").innerText.replace(/\s+/g," ").slice(0,400)));
await browser.close();
