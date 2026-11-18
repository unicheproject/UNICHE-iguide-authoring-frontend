import { start, goEd, P, tall, poi, place, MINE } from "./common.mjs";
for (const vp of ["1280","1024","768","zoom200"]) {
  const s = await start(vp); const { page } = s;
  for (const [k, path] of [["poi-wc", "/pois/"+poi("frieze").id], ["place-plan", "/places/"+place("parthenon").id]]) {
    await goEd(page, path);
    const m = await page.evaluate(()=>{ const main=document.querySelector("main"); return { scrollH: main.scrollHeight, hOverflow: document.documentElement.scrollWidth>innerWidth, mainOverflowX: main.scrollWidth>main.clientWidth, nav: !!document.querySelector("nav") && Math.round(document.querySelector("nav").getBoundingClientRect().width), mainW: Math.round(main.clientWidth)}; });
    console.log(vp, k, JSON.stringify(m));
    await s.shot(`${k}__top`);
    if (k==="poi-wc" || vp==="768") await tall(s, `${k}`);
  }
  await s.browser.close();
}
