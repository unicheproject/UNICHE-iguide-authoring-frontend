import { open, go, shot, POP, t, focusDesc, run } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","1280","1024","768","zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${POP}/preview`);
    await page.waitForTimeout(1500);
    await shot(page, "preview__default", vp, true);
    if (vp==="1440") {
      console.log((await t(page)).slice(0,2500));
      console.log("title", await page.title());
      console.log(await page.evaluate(()=>[...document.querySelectorAll("[role=tab],[aria-pressed],select,button")].filter(e=>!e.closest("[data-preview-frame]")).map(e=>e.tagName+":"+(e.getAttribute("role")||"")+":"+(e.getAttribute("aria-label")||e.textContent.trim()).slice(0,40)+":"+(e.getAttribute("aria-selected")||e.getAttribute("aria-pressed")||"")).join("\n")));
    }
    console.log(vp, await page.evaluate(()=>({scale:document.querySelector("[data-preview-frame]")?.dataset.scale, sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth})));
    await browser.close();
  }
});
