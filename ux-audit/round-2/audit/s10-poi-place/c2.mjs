import { open, go, rec, P, ready, SH, tall, axe } from "./h.mjs";
const log=(...a)=>console.log(...a);
const focus=(page)=>page.evaluate(()=>{const a=document.activeElement;return a?`${a.tagName}#${a.id}.${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,30)}`:null});
for (const vp of ["zoom200","1440"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
  await page.evaluate(()=>{document.querySelector("main").scrollTop=900});
  await page.waitForTimeout(500);
  const m=await page.evaluate(()=>{const s=[...document.querySelectorAll("*")].filter(e=>getComputedStyle(e).position==="sticky"&&e.getBoundingClientRect().height>40&&e.getBoundingClientRect().top<200); const hdr=document.querySelector("header").getBoundingClientRect().height; return {innerH:innerHeight,appHeader:hdr, sticky:s.map(e=>[Math.round(e.getBoundingClientRect().top),Math.round(e.getBoundingClientRect().bottom)])}});
  log(vp,"scrolled", JSON.stringify(m));
  await page.screenshot({path:SH+`poi-editor__scrolled__${vp}.png`});
  if (vp==="1440") {
    // keyboard: tab from top to first editor field, count
    await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
    log("focus on load", await focus(page));
    const seq=[]; for(let i=0;i<14;i++){await page.keyboard.press("Tab"); seq.push(await focus(page));} log(seq.join(" > "));
    // Esc inside map / tab through map region count
    await page.locator("#f-lat").focus(); let n=0; for(;n<40;n++){await page.keyboard.press("Tab"); const t=await page.evaluate(()=>document.activeElement.closest("[id=triggers],#triggers")?"triggers":document.activeElement.id||document.activeElement.tagName); if(t==="triggers")break;} log("tabs lat->triggers",n+1);
    await axe(page,"poi A active pending");
    // expand Practical details
    await page.getByRole("button",{name:/Practical details/}).click(); await page.waitForTimeout(500);
    log("practical expanded fields", await page.locator("[id^=f-]").evaluateAll(e=>e.map(x=>x.id)));
    log("focus after toggle", await focus(page), "aria-expanded", await page.getByRole("button",{name:/Practical details/}).getAttribute("aria-expanded"));
  }
  await browser.close();
}
