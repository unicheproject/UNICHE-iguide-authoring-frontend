import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const { browser, page } = await open("admin", { viewport: "zoom200" });
await go(page, R.categories+"?lang=el"); await page.waitForSelector("h1"); await page.waitForTimeout(2000);
await page.locator("#tab-el").focus();
const out=[];
for (let i=0;i<12;i++){
  await page.keyboard.press("Tab"); await page.waitForTimeout(150);
  out.push(await page.evaluate(()=>{const e=document.activeElement; const r=e.getBoundingClientRect(); const st=[...document.querySelectorAll("header,div")].filter(x=>{const p=getComputedStyle(x).position; return (p==="sticky"||p==="fixed")&&x.getBoundingClientRect().height>0&&x.getBoundingClientRect().top<200&&x.getBoundingClientRect().width>300}).map(x=>x.getBoundingClientRect().bottom); const stick=Math.max(...st,0); return `${e.tagName}#${e.id} "${(e.getAttribute("aria-label")||e.innerText||"").trim().slice(0,30)}" top=${Math.round(r.top)} bottom=${Math.round(r.bottom)} stickyBottom=${Math.round(stick)} hidden=${r.top<stick-1} vh=${innerHeight}`}));
}
console.log(out.join("\n"));
await shot(page,"category-editor__el-tab-keyboard__zoom200");
await browser.close();
