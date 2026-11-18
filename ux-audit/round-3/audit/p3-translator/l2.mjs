import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
for (const vp of ["1440","1024","768","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, base+"/routes?q=UX-R3-p3");
await page.waitForSelector("h1"); await page.waitForTimeout(2200);
const inp = page.getByPlaceholder(/Search/).first();
await inp.fill("Περίπατος");
await page.waitForTimeout(1800);
await shot(page,`routes-list__long-greek-title__${vp}`);
const r = await page.evaluate(()=>{
  const row=document.querySelector("tbody tr"); if(!row) return "no row";
  const out=[];
  row.querySelectorAll("a,span,p,div,bdi").forEach(e=>{ if(e.children.length>1) return; const t=(e.innerText||"").trim(); if(!t||t.length<12) return; const cs=getComputedStyle(e); const rc=e.getBoundingClientRect(); out.push(`${e.tagName} "${t.slice(0,30)}" w=${Math.round(rc.width)} h=${Math.round(rc.height)} sw=${e.scrollWidth} cw=${e.clientWidth} wb=${cs.wordBreak} ow=${cs.overflowWrap} hy=${cs.hyphens} ov=${cs.overflow} clamp=${cs.webkitLineClamp} ff=${cs.fontFamily.split(",")[0]} fs=${cs.fontSize}`);});
  const rr=row.getBoundingClientRect();
  return {rowH:Math.round(rr.height), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, out};
});
console.log(vp, JSON.stringify(r,null,1));
await browser.close();
}
