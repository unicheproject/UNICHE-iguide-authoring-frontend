import { open, go, shot, axe, run, CMS, t, focusDesc } from "./lib.mjs";
const RESUME = "/projects/new?resume=413877ea-0852-4b3a-8f1f-96c4c99ae269";
async function scrollAll(page, y){ await page.evaluate((y)=>document.querySelectorAll("*").forEach(e=>{ if(e.scrollHeight>e.clientHeight+20 && /auto|scroll/.test(getComputedStyle(e).overflowY)) e.scrollTop=y; }), y); await page.waitForTimeout(300); }
await run(async () => {
  for (const vp of ["1440","1024","768","zoom200"]) {
    const { browser, page } = await open("admin", { viewport: vp });
    const writes=[]; page.on("request",r=>{ if(r.method()!=="GET" && /localhost:8080/.test(r.url())) writes.push(r.method()+" "+r.url().replace(/.*v1/,"")); });
    await go(page, RESUME); await page.waitForTimeout(2500);
    await shot(page,"wizard__step2",vp);
    await scrollAll(page, 5000); await shot(page,"wizard__step2-bottom",vp);
    await page.getByRole("button",{name:/^continue/i}).click(); await page.waitForTimeout(800);
    console.log(vp,"step3 focus", await focusDesc(page));
    await scrollAll(page, 0); await shot(page,"wizard__step3",vp); 
    if (vp==="1440") { console.log((await t(page,"main")).slice(0,1600)); await axe(page,"wizard3"); }
    await scrollAll(page, 5000); await shot(page,"wizard__step3-bottom",vp);
    await page.getByRole("button",{name:/^continue/i}).click(); await page.waitForTimeout(800);
    console.log(vp,"step4 focus", await focusDesc(page));
    await scrollAll(page, 0); await shot(page,"wizard__step4",vp);
    if (vp==="1440") { console.log((await t(page,"main")).slice(0,2200)); await axe(page,"wizard4"); }
    await scrollAll(page, 5000); await shot(page,"wizard__step4-bottom",vp);
    console.log(vp,"writes", JSON.stringify(writes));
    await browser.close();
  }
});
