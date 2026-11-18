import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "1440" });
const kind = process.argv[2];
await go(page, R[kind]);
await page.waitForSelector("h1"); await page.waitForTimeout(2000);
await shot(page, `${kind}-editor__default-tab__1440`, true);
console.log("DEFAULT TAB\n"+await page.evaluate(()=>[...document.querySelectorAll("main input,main textarea,main select,main button,main [role=tab]")].filter(e=>e.offsetParent).map(e=>`${e.tagName.toLowerCase()}${e.getAttribute("role")?"["+e.getAttribute("role")+"]":""} ${e.id} | ${(e.getAttribute("aria-label")||e.labels?.[0]?.innerText||e.innerText||e.value||"").trim().replace(/\s+/g," ").slice(0,60)}`).join("\n")));
for (const l of ["el","it"]) {
await go(page, R[kind]+"?lang="+l);
await page.waitForSelector("h1"); await page.waitForTimeout(2000);
await shot(page, `${kind}-editor__${l}-tab__1440`, true);
console.log(`TAB ${l}\n`+await page.evaluate(()=>[...document.querySelectorAll("main input,main textarea,main select,main button,main [role=tab]")].filter(e=>e.offsetParent).map(e=>`${e.tagName.toLowerCase()}${e.getAttribute("role")?"["+e.getAttribute("role")+"]":""} ${e.id} | ${(e.getAttribute("aria-label")||e.labels?.[0]?.innerText||e.innerText||e.value||"").trim().replace(/\s+/g," ").slice(0,60)}`).join("\n")));
}
await browser.close();
