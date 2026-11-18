import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const dir = new URL("./files/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const s = await start(vp); const { page } = s;
await go(page, `${P}/pois`); await page.waitForSelector("tbody tr a");
await page.locator("tbody tr a").first().click(); await page.waitForSelector("h1"); await page.waitForTimeout(2500);
const b = page.getByRole("button",{name:/^Add image/i}).first();
await b.scrollIntoViewIfNeeded(); await b.click(); await page.waitForTimeout(1200);
if (vp==="1440") {
 await page.locator("[role=dialog] ul li button").nth(3).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
 await s.shot("picker__selected-noalt");
 console.log("footer:", await page.evaluate(()=>document.querySelector("[role=dialog]").innerText.split("\n").slice(-8).join(" | ")));
 console.log("aria-pressed", await page.locator("[role=dialog] ul li button").nth(3).getAttribute("aria-pressed"));
 // upload from picker
 await page.locator("[role=dialog] input[type=file]").setInputFiles(dir+"UX-s13-media square.png"); await page.waitForTimeout(3500);
 await s.shot("picker__after-upload");
 console.log("footer2:", await page.evaluate(()=>document.querySelector("[role=dialog]").innerText.split("\n").slice(-10).join(" | ")));
} else { await s.shot("picker__open"); 
 console.log(JSON.stringify(await page.evaluate(()=>{const d=document.querySelector("[role=dialog]").getBoundingClientRect(); const sc=[...document.querySelectorAll("[role=dialog] *")].find(e=>getComputedStyle(e).overflowY==="auto"); return {d:[d.top,d.height,innerHeight], sc: sc?sc.clientHeight:null}}))); }
await s.browser.close();
