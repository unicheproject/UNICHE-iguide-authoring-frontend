import { open, go, rec, P, ready, SH, tall } from "./h.mjs";
const log=(...a)=>console.log(...a);
const which = process.argv[2]; // poiA | poiB
for (const vp of ["1440","1280","1024","768","zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${P}/pois/${rec[which]}`); await ready(page);
  const m = await page.evaluate(()=>{
    const main=document.querySelector("main"); const mr=main.getBoundingClientRect();
    const sec=(sel)=>{const e=document.querySelector(sel); if(!e) return null; const r=e.getBoundingClientRect(); return {top:Math.round(r.top-mr.top+main.scrollTop), h:Math.round(r.height)}};
    const stick=[...document.querySelectorAll("*")].filter(e=>getComputedStyle(e).position==="sticky"&&e.getBoundingClientRect().height>20).map(e=>({c:e.className.toString().slice(0,30),top:Math.round(e.getBoundingClientRect().top),h:Math.round(e.getBoundingClientRect().height)}));
    const heads=[...document.querySelectorAll("main h2")].map(h=>({t:h.textContent.trim().slice(0,28), y:Math.round(h.getBoundingClientRect().top-mr.top+main.scrollTop)}));
    const asideCards=[...document.querySelectorAll("aside h2, aside h3")].map(h=>({t:h.textContent.trim().slice(0,24), y:Math.round(h.getBoundingClientRect().top-mr.top+main.scrollTop)}));
    return {inner:[innerWidth,innerHeight], mainH:main.scrollHeight, mainClient:main.clientHeight, hscroll:document.documentElement.scrollWidth>innerWidth||main.scrollWidth>main.clientWidth, stick, heads, asideCards};
  });
  log(vp, JSON.stringify(m));
  await page.screenshot({path:SH+`poi-editor__${which}__${vp}.png`});
  await tall(page,`poi-editor__${which}-tall__${vp}`);
  await browser.close();
}
