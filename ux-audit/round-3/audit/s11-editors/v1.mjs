import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const vps=(process.argv[2]||"1280,1024,768,zoom200").split(",");
for (const vp of vps){
 const { browser, page } = await open("admin", { viewport: vp });
 for (const [k,id,n] of [["routes",IDS.route,"route"],["guides",IDS.guide,"guide"],["events",IDS.event,"event"],["categories",IDS.category,"category"]]){
  await go(page, url(k,id)); await settle(page,1500);
  await shot(page,`${n}__top__${vp}`);
  await page.screenshot({path:`ux-audit/round-3/audit/s11-editors/shots/${n}__full__${vp}.png`, fullPage:true});
  const m = await page.evaluate(()=>{
   const de=document.documentElement; const over=[...document.querySelectorAll("main *")].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0 && (r.right>innerWidth+1||r.left<-1)}).slice(0,5).map(e=>e.tagName+"."+(e.className||"").toString().slice(0,40)+" r="+Math.round(e.getBoundingClientRect().right));
   const small=[...document.querySelectorAll("main button, main a, main input:not([type=radio]):not([type=checkbox]), main select")].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0&&r.height>0&&(r.height<24||r.width<24)}).slice(0,6).map(e=>(e.getAttribute("aria-label")||e.textContent||e.id).trim().slice(0,30)+" "+Math.round(e.getBoundingClientRect().width)+"x"+Math.round(e.getBoundingClientRect().height));
   const hdr=document.querySelector("header"); const sticky=[...document.querySelectorAll("*")].filter(e=>getComputedStyle(e).position==="sticky"&&e.getBoundingClientRect().height>0).map(e=>e.tagName+" top="+Math.round(e.getBoundingClientRect().top)+" h="+Math.round(e.getBoundingClientRect().height));
   return {sw:de.scrollWidth, cw:de.clientWidth, over, small, sticky:sticky.slice(0,6)}});
  console.log(vp,n,JSON.stringify(m));
 }
 await browser.close();
}
