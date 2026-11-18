import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, R.routes+"?lang=el");
await page.waitForSelector("h1"); await page.waitForTimeout(2000);
const stops = page.locator("input[id^=stop-],textarea[id^=stop-]");
console.log("stop fields", await stops.count());
let i=0;
for (const h of await stops.elementHandles()) { await h.fill(`Στάση κείμενο ${++i}`); }
await page.waitForTimeout(500);
console.log(await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," ")).join(" / ")));
await shot(page,"route-editor__el-stop-filled__1440",true);
await page.getByRole("button",{name:/^Save/}).first().click();
await page.waitForTimeout(2500);
await page.getByRole("tab",{name:/Italiano/}).click();
i=0; for (const h of await page.locator("input[id^=stop-],textarea[id^=stop-]").elementHandles()) { await h.fill(`Testo tappa ${++i}`); }
await page.waitForTimeout(500);
console.log(await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," ")).join(" / ")));
await page.getByRole("button",{name:/^Save/}).first().click();
await page.waitForTimeout(2500);
console.log(await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," ")).join(" / ")));
console.log(await page.evaluate(()=>[...document.querySelectorAll("button")].filter(b=>/^(Warning|Blocking)/.test(b.innerText)).map(e=>e.innerText.trim()).join(" | ")));
console.log(await page.evaluate(()=>[...document.querySelectorAll("button")].filter(b=>b.getBoundingClientRect().y<120 && /fix|warning|Nothing/i.test(b.innerText)).map(e=>e.innerText.trim()).join(" | ")));
await browser.close();
