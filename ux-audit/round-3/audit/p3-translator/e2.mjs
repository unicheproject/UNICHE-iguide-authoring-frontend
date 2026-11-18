import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, R.events);
await page.waitForSelector("h1"); await page.waitForTimeout(1500);
if (!(await page.locator("#f-summary").inputValue())) { await page.locator("#f-summary").fill("An English test event summary."); await page.locator("#f-description").fill("An English test event description."); await page.locator("#f-locationText").fill("Main hall"); }
if (!(await page.locator("#occ-start-o-1-day").count()) && !(await page.locator("[id^=occ-start][id$=-day]").count())) { await page.locator("#occ-add").click(); await page.waitForTimeout(500); }
await page.getByRole("button",{name:/^Save/}).first().click();
await page.waitForTimeout(2500);
for (const l of ["el","it"]) {
  await page.getByRole("tab",{name: l==="el"?/Ελληνικά/:/Italiano/}).click();
  await page.waitForTimeout(800);
  await shot(page,`event-editor__${l}-tab-dates__1440`,true);
  console.log(l, await page.evaluate(()=>{const t=[...document.querySelectorAll("main *")].filter(e=>e.children.length===0 && /2026|Νοε|Nov|nov/.test(e.innerText||"")).map(e=>`${e.tagName}:${e.innerText.trim().replace(/\s+/g," ")} lang=${e.closest("[lang]")?.lang}`); return t.join("\n")}));
}
await browser.close();
