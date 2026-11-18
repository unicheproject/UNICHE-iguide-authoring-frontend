import { start, go, P } from "./common.mjs";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const ids = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url)));
const s = await start("1440"); const { page } = s;
for (const [name, path, wait] of [["maps", "/maps",1500],["floor-plans","/floor-plans",1500],["map-editor",`/maps/${ids.map}`,5000],["fp-editor",`/floor-plans/${ids.plan}`,2500]]) {
  await go(page, P+path); await page.waitForTimeout(wait);
  const r = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa","wcag22aa"]).analyze();
  console.log("AXE", name, r.violations.map(v=>`${v.id}(${v.nodes.length}) ${v.nodes.slice(0,2).map(n=>n.target.join(" ").slice(0,80)).join(" ; ")}`));
  const small = await page.evaluate(()=>{
    const out={}; const walker=document.createTreeWalker(document.querySelector("main"),NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const n=walker.currentNode; if(!n.textContent.trim()) continue; const el=n.parentElement; if(!el.offsetParent) continue; const fs=parseFloat(getComputedStyle(el).fontSize); if(fs<12){out[fs]=(out[fs]||0)+1}}
    return out;});
  console.log("TEXT <12px counts", name, JSON.stringify(small));
}
// contrast samples on map editor & fp editor
await go(page, P+`/floor-plans/${ids.plan}`); await page.waitForTimeout(2500);
const lum=(c)=>{const m=c.match(/[\d.]+/g).map(Number);const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)};return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2])};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return ((x+0.05)/(y+0.05)).toFixed(2)};
const samples = await page.evaluate(()=>{
 const pick=(sel,txt)=>[...document.querySelectorAll(sel)].find(e=>e.textContent.trim().startsWith(txt));
 const f=(e)=>{if(!e)return null;const cs=getComputedStyle(e);let bg=cs.backgroundColor,p=e;while(bg==="rgba(0, 0, 0, 0)"&&p.parentElement){p=p.parentElement;bg=getComputedStyle(p).backgroundColor}return {c:cs.color,bg,fs:cs.fontSize}};
 return {coord:f(pick("span","Coordinate system")), kind:f(pick("span","Point of Interest")), place:f(pick("button","Place")), remove:f(pick("button","Remove from plan")), xlabel:f(pick("label","x")), hint:f(pick("span","The indoor place"))};
});
for (const [k,v] of Object.entries(samples)) if(v) console.log("CONTRAST", k, v.fs, cr(v.c,v.bg), v.c, v.bg);
await s.browser.close();
