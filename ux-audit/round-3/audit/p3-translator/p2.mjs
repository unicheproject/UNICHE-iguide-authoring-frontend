import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
const tabs = async (l) => console.log(l, await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," ")).join(" / ")+" || "+[...document.querySelectorAll("button")].filter(b=>/^(Warning|Blocking)/.test(b.innerText)).map(e=>e.innerText.trim()).join(" | ")));
await go(page, R.pois);
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
const T = {el:["Οδηγίες για την επίσκεψη.","Πληροφορίες προσβασιμότητας."], it:["Istruzioni per la visita.","Informazioni sull'accessibilità."]};
for (const l of ["el","it"]) {
  await page.getByRole("tab",{name:l==="el"?/Ελληνικά/:/Italiano/}).click();
  await page.waitForTimeout(500);
  if (l==="it") { await page.getByRole("button",{name:/Copy source for Title/}).click(); await page.locator("#f-summary").fill("Breve riassunto della scultura di prova."); await page.locator("#f-description").fill("Primo paragrafo.\nSecondo paragrafo."); }
  if (!(await page.locator("#f-instructions").count())) await page.getByRole("button",{name:/Practical details/}).click();
  await page.waitForTimeout(300);
  await page.locator("#f-instructions").fill(T[l][0]);
  await page.locator("#f-accessibilityInformation").fill(T[l][1]);
  await tabs(l);
}
await page.getByRole("button",{name:/^Save/}).first().click();
await page.waitForTimeout(2500);
await tabs("saved");
await page.getByRole("button",{name:/Save and activate|^Activate/}).first().click();
await page.waitForTimeout(1000);
await shot(page,"poi-editor__activate-dialog__1440");
console.log(await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText));
await browser.close();
