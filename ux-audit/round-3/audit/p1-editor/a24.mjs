import {open,go,P,shot,btns,hdr} from "./lib.mjs";
const D2="C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/audit/p1-editor/";
import fs from "node:fs";
const out={};
for(const vp of ["1440","1280","1024","768"]){
const { browser, page } = await open("admin",{viewport:vp});
for(const kind of ["places","pois","routes","guides","events","categories"]){
  const t=Date.now();
  await go(page,P+"/"+kind); await page.waitForSelector("tbody tr",{timeout:20000}).catch(()=>{});
  const ms=Date.now()-t;
  await page.waitForTimeout(500);
  const m=await page.evaluate(()=>{
    const r=e=>e?e.getBoundingClientRect():null;
    const main=document.querySelector("main");
    const h1=r(document.querySelector("main h1"));
    const search=r(document.querySelector("main input[type=search]"));
    const tbl=r(document.querySelector("main table"));
    const card=document.querySelector("main table")?.closest("[class*=card],[class*=rounded]");
    const ths=[...document.querySelectorAll("main thead th")].map(t=>[t.innerText.trim().replace(/\s+/g," ").slice(0,14),Math.round(r(t).x),Math.round(r(t).width)]);
    const rows=[...document.querySelectorAll("tbody tr")].map(x=>Math.round(r(x).height));
    const first=document.querySelector("tbody tr");
    const trunc=[...document.querySelectorAll("tbody td *")].filter(e=>e.children.length==0&&e.scrollWidth>e.clientWidth+1).length;
    const hscroll=main.scrollWidth>main.clientWidth||document.documentElement.scrollWidth>innerWidth;
    const newBtn=[...document.querySelectorAll("main button,main a")].find(b=>/^New /.test(b.innerText.trim()));
    return {h1x:h1&&Math.round(h1.x),searchx:search&&Math.round(search.x),tblx:tbl&&Math.round(tbl.x),tblw:tbl&&Math.round(tbl.width),newR:newBtn&&Math.round(r(newBtn).right),tblR:tbl&&Math.round(tbl.right),ths,rowmin:Math.min(...rows),rowmax:Math.max(...rows),rows:rows.length,trunc,hscroll};
  });
  out[vp+"/"+kind]={ms,...m};
  await shot(page,`list-${kind}__default__${vp}`);
  console.log(vp,kind,JSON.stringify({ms,...m}));
}
await browser.close();
}
fs.writeFileSync(D2+"measure-lists.json",JSON.stringify(out,null,1));
