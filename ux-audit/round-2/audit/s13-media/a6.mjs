import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const id = "ef5b3867-eb1a-4ded-b8f2-89d829d9d041"; // klepsydra (read only)
for (const vp of ["1280","1024","768","zoom200"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${POP}/media/${id}`);
  await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(1800);
  const m = async (tag) => page.evaluate(()=>{ const r=(s)=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return `top=${Math.round(b.top)} bot=${Math.round(b.bottom)} left=${Math.round(b.left)} w=${Math.round(b.width)}`};
    const img=[...document.querySelectorAll("main img, main video, main audio")][0]; const ib=img?.getBoundingClientRect();
    const sc=[...document.querySelectorAll("*")].filter(e=>e.scrollHeight>e.clientHeight+20&&["auto","scroll"].includes(getComputedStyle(e).overflowY)).map(e=>e.tagName+"."+(e.className+"").slice(0,25)+" "+e.scrollHeight+"/"+e.clientHeight);
    return {alt:r("#f-alternativeText"), img: ib?`top=${Math.round(ib.top)} h=${Math.round(ib.height)} w=${Math.round(ib.width)}`:null, vw:innerWidth, vh:innerHeight, sc};});
  console.log(vp,"top", JSON.stringify(await m()));
  await shot(page,"asset-editor__top",vp);
  // scroll scroller
  await page.evaluate(()=>{ const s=[...document.querySelectorAll("*")].find(e=>e.scrollHeight>e.clientHeight+20&&["auto","scroll"].includes(getComputedStyle(e).overflowY)); if(s) s.scrollTop=420; else scrollTo(0,420);});
  await page.waitForTimeout(300);
  console.log(vp,"scrolled420", JSON.stringify(await m()));
  await shot(page,"asset-editor__scrolled",vp);
  await browser.close();
}
