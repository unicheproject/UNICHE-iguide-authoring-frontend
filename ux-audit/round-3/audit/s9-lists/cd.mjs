import { open, go, P, shot, settle, KINDS } from "./h.mjs";
for (const vp of ["768","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
for (const k of KINDS) {
  await go(page, `/projects/${P}/${k}`); await settle(page, 2000);
  const m = await page.evaluate(() => {
    const r = e => e ? (b => [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)])(e.getBoundingClientRect()) : null;
    const tb = document.querySelector("[role=search]");
    const seg = document.querySelector("main fieldset");
    const rows = [...document.querySelectorAll("main table tbody tr")];
    const hs = rows.map(x => x.getBoundingClientRect().height).sort((a,b)=>a-b);
    const kebabs = [...document.querySelectorAll("main table tbody tr button[aria-label^='Actions']")].slice(0,3).map(b => r(b));
    return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, tb: r(tb), tbPos: tb && getComputedStyle(tb).position, seg: r(seg), segVisible: seg && seg.offsetWidth > 0, rows: rows.length, med: hs[Math.floor(hs.length/2)], max: hs[hs.length-1], kebabs, thVisible: !!document.querySelector("main thead") && document.querySelector("main thead").offsetHeight, headerH: r(document.querySelector("header")), sidebar: r(document.querySelector("nav")) };
  });
  console.log(k, vp, JSON.stringify(m));
  await shot(page, `${k}__default__${vp}`);
}
await browser.close();
}
