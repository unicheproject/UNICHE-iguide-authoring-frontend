import {open,go,P,shot,btns,hdr} from "./lib.mjs";
const out={};
for(const vp of ["1440","1280"]){
const { browser, page } = await open("admin",{viewport:vp});
for(const kind of ["places","pois","routes","guides","events","categories"]){
  await go(page,P+"/"+kind); await page.waitForSelector("tbody tr",{timeout:20000}).catch(()=>{});
  await page.waitForTimeout(400);
  const row=page.locator("tbody tr").first();
  const title=(await row.innerText()).split("\n").filter(x=>x.trim())[0].trim();
  const t=Date.now();
  await row.getByText(title,{exact:false}).first().click();
  await page.waitForURL(new RegExp(kind+"/[0-9a-f-]{36}"),{timeout:15000});
  await page.waitForSelector("main h1",{timeout:15000});
  await page.waitForLoadState("networkidle").catch(()=>{});
  const ms=Date.now()-t;
  await page.waitForTimeout(700);
  const m=await page.evaluate(()=>{
    const r=e=>e?e.getBoundingClientRect():null; const q=s=>document.querySelector(s);
    const h1=r(q("main h1")); const bc=r(q("main nav[aria-label*=readcrumb] a, main nav a"));
    const side=[...document.querySelectorAll("main aside, main [class*=sticky]")].map(e=>[Math.round(r(e).x),Math.round(r(e).y),Math.round(r(e).width)]).slice(0,4);
    const cards=[...document.querySelectorAll("main section")].map(s=>[Math.round(r(s).x),Math.round(r(s).width)]).slice(0,6);
    const btnRow=[...document.querySelectorAll("main button")].filter(b=>/Save|Apply|Activate|Deactivate|Discard/.test(b.innerText)).map(b=>[b.innerText.trim().replace(/\s+/g," ").slice(0,22),Math.round(r(b).y),Math.round(r(b).height),Math.round(r(b).x)]);
    const scrollH=q("main").scrollHeight;
    const hs=document.documentElement.scrollWidth>innerWidth;
    return {h1x:h1&&Math.round(h1.x),h1y:h1&&Math.round(h1.y),bcx:bc&&Math.round(bc.x),side,cards,btnRow,scrollH,hs};
  });
  out[vp+"/"+kind]={title,ms,...m};
  await shot(page,`editor-${kind}__first__${vp}`);
  console.log(vp,kind,JSON.stringify({title:title.slice(0,30),ms,...m}));
}
await browser.close();
}
