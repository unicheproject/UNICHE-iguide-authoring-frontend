import {open,go,P,shot,hdr} from "./lib.mjs";
const A=P+"/pois/d2e48820-a468-4539-9f62-545eed5b06a6";
for(const vp of ["1024","768","zoom200"]){
 const { browser, page } = await open("admin",{viewport:vp, reducedMotion: vp==="zoom200"?"reduce":"no-preference"});
 await go(page,A); await page.waitForSelector("#f-title"); await page.waitForTimeout(900);
 await shot(page,`poi-editor__alpha-active__${vp}`);
 const m=await page.evaluate(()=>{const r=e=>e.getBoundingClientRect();const stick=[...document.querySelectorAll("main *")].filter(e=>getComputedStyle(e).position==="sticky"&&r(e).top<200).map(e=>Math.round(r(e).bottom));return {hs:document.documentElement.scrollWidth>innerWidth, stickyBottom:Math.max(0,...stick), vh:innerHeight, btns:[...document.querySelectorAll("main button")].filter(b=>/Save draft|Apply changes/.test(b.innerText)).map(b=>[b.innerText.trim().slice(0,12),Math.round(r(b).height)])}});
 console.log(vp,JSON.stringify(m));
 await go(page,P+"/pois"); await page.waitForTimeout(1500);
 await shot(page,`list-pois__default-v2__${vp}`);
 console.log(vp,"anims:",await page.evaluate(()=>document.getAnimations().length));
 await browser.close();
}
