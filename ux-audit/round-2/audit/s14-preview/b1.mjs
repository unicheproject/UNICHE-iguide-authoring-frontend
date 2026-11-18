import { open, go, shot, POP, t, focusDesc, run } from "./lib.mjs";
const tab = (page, n) => page.getByRole("tab", { name: n, exact: true });
const info = (page) => page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); const r=f.getBoundingClientRect(); return {scale:f.dataset.scale, frameTop:Math.round(r.top+scrollY), w:Math.round(r.width), h:Math.round(r.height), hscroll:f.scrollWidth>f.clientWidth, group:f.getAttribute("role"), cap:document.querySelector("section[role=region] p")?.textContent.trim()}; });
await run(async () => {
  for (const vp of ["1440","1024","768"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/preview`); await page.waitForTimeout(1200);
    for (const s of ["Mobile","Kiosk","Web"]) {
      await tab(page, s).click(); await page.waitForTimeout(500);
      for (const z of ["Fit","100 %","50 %"]) {
        await tab(page, z).click(); await page.waitForTimeout(400);
        console.log(vp, s, z, JSON.stringify(await info(page)));
        if ((s==="Kiosk"&&z==="Fit")||(z==="100 %"&&s==="Web")||(s==="Mobile"&&z==="Fit")) await shot(page, `preview__${s.toLowerCase()}-${z.replace(/\W/g,"")}`, vp, true);
      }
      await tab(page,"Fit").click();
    }
    await browser.close();
  }
});
