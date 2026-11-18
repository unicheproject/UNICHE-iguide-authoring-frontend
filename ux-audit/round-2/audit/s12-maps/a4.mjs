import { open, go, shot, POP, t, run, axe } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
await run(async () => {
  for (const vp of ["1440","1280","1024","768","zoom200"]) {
    const { browser, page } = await open("admin", { viewport: vp });
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
    await go(page, `/projects/${POP}/maps/${MAP}`);
    await page.waitForTimeout(2500);
    await shot(page, "map-editor__default", vp, true);
    await shot(page, "map-editor__default-fold", vp);
    const m = await page.evaluate(() => { const c=document.querySelector(".leaflet-container"); const r=c.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height, vh: innerHeight, docW: document.documentElement.scrollWidth, innerW: innerWidth}; });
    console.log(vp, JSON.stringify(m));
    if (vp==="1440") { console.log((await t(page,"main")).slice(0,4000)); await axe(page,"map-editor"); }
    await browser.close();
  }
});
