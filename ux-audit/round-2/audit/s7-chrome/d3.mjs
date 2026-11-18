import { open, go, shot, run, POP } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await open("curator", { viewport: "1440" });
  const q = async (id) => (await page.evaluate(()=>[...document.querySelectorAll(".z-toast > div")].length));
  async function make(name){
    await go(page, `/projects/${POP}/categories`); await page.waitForTimeout(1500);
    await page.getByRole("button", { name: /new category/i }).click(); await page.waitForTimeout(300);
    await page.locator("[role=dialog] input").first().fill(name);
    await page.locator("[role=dialog]").getByText("Routes", {exact:true}).click();
    await page.getByRole("button", { name: /^create and open/i }).click();
    await page.waitForSelector(".z-toast > div", { timeout: 8000 });
  }
  // focus pause: tab to the dismiss button
  await go(page, `/projects/${POP}/categories`); await page.waitForTimeout(500);
  await make("UX-R2-s7-chrome toast timing G");
  await page.evaluate(()=>{ window.__ev=[]; const c=document.querySelector(".z-toast"); ["focusin","focusout","mouseenter","mouseleave"].forEach(e=>c.addEventListener(e,()=>window.__ev.push(e+"@"+Math.round(performance.now())),true)); window.__t0=performance.now(); }); let n=0, tt=Date.now(); for(;n<120;n++){ await page.keyboard.press("Shift+Tab"); const a=await page.evaluate(()=>document.activeElement.getAttribute("aria-label")); if(a==="Dismiss notification") break; if(!(await q())) { console.log("toast gone while tabbing after", n, "presses", Date.now()-tt, "ms"); break; } } console.log("shift-tabs to reach dismiss:", n, "in", Date.now()-tt, "ms; toasts left", await q()); for(let i=0;i<14;i++){ await page.waitForTimeout(500); if(i%2==0) console.log(" t+"+((i+1)*500)+"ms count", await q(), "active", await page.evaluate(()=>document.activeElement.getAttribute("aria-label")), JSON.stringify(await page.evaluate(()=>window.__ev))); }
  await shot(page,"toast__focused-dismiss","1440");
  await page.keyboard.press("Tab"); const t2=Date.now(); let g3=null; while(Date.now()-t2<10000){ if(!(await q())){g3=Date.now()-t2;break;} await page.waitForTimeout(100);} console.log("after blur dismissed ms:", g3);
  await browser.close();
});
