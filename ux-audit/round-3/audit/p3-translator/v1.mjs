import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
for (const vp of ["1024","768","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, R.pois+"?lang=el"); await page.waitForSelector("h1"); await page.waitForTimeout(2000);
await shot(page,`poi-editor__el-tab__${vp}`);
const r = await page.evaluate(()=>{
  const q=(s)=>document.querySelector(s);
  const src=q("#f-title-source")||q("[id$=-source]"); const tgt=q("#f-title");
  const sb=src?.getBoundingClientRect(), tb=tgt?.getBoundingClientRect();
  const copy=[...document.querySelectorAll("button")].filter(b=>/Copy source/.test(b.innerText)||/Copy source/.test(b.getAttribute("aria-label")||"")).slice(0,3).map(b=>{const x=b.getBoundingClientRect(); return Math.round(x.width)+"x"+Math.round(x.height)});
  const tabs=[...document.querySelectorAll("[role=tab]")].map(t=>{const x=t.getBoundingClientRect(); return Math.round(x.width)+"x"+Math.round(x.height)});
  const sticky=[...document.querySelectorAll("header,[class*=sticky]")].filter(e=>getComputedStyle(e).position==="sticky"||getComputedStyle(e).position==="fixed").map(e=>{const x=e.getBoundingClientRect(); return e.tagName+" y"+Math.round(x.y)+" h"+Math.round(x.height)});
  const hs=document.documentElement.scrollWidth>document.documentElement.clientWidth;
  return {srcX:sb&&Math.round(sb.x),srcW:sb&&Math.round(sb.width),srcY:sb&&Math.round(sb.y),tgtX:tb&&Math.round(tb.x),tgtW:tb&&Math.round(tb.width),tgtY:tb&&Math.round(tb.y),sideBySide: sb&&tb&&Math.abs(sb.y-tb.y)<5,copy,tabs,sticky,hs,vw:innerWidth};
});
console.log(vp,JSON.stringify(r));
await browser.close();
}
