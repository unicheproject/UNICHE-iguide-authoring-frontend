import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const A = readFileSync("ux-audit/round-3/audit/p3-translator/asset.txt","utf8").trim();
for (const vp of ["1440","1024","768"]) {
const { browser, page } = await open("admin", { viewport: vp });
for (const [k,u] of [["poi",R.pois],["route",R.routes],["guide",R.guides],["event",R.events],["category",R.categories],["asset",A]]) {
  await go(page, u+"?lang=el"); await page.waitForSelector("h1"); await page.waitForTimeout(1800);
  const r = await page.evaluate(()=>{const tl=document.querySelector("[role=tablist]"); const r=tl.getBoundingClientRect(); const tabs=[...tl.querySelectorAll("[role=tab]")].map(t=>{const b=t.getBoundingClientRect(); return Math.round(b.width)+"x"+Math.round(b.height)}); const h2=[...document.querySelectorAll("h2")].find(h=>/^Texts/.test(h.innerText)); const hb=h2?.getBoundingClientRect(); const nm=[...document.querySelectorAll("button")].filter(b=>/Next missing/.test(b.innerText)).map(b=>{const x=b.getBoundingClientRect(); return `${Math.round(x.x)},${Math.round(x.y+scrollY)} vis=${x.width>0}`}); const card=document.querySelector("[role=tabpanel]")?.getBoundingClientRect(); return {tablistY:Math.round(r.y+scrollY),tablistH:Math.round(r.height),tabs,headingY:Math.round((hb?.y||0)+scrollY),gap:Math.round(r.y-(hb?.bottom||0)),nm,panelY:Math.round((card?.y||0)+scrollY)}});
  console.log(vp,k,JSON.stringify(r));
}
await browser.close();
}
