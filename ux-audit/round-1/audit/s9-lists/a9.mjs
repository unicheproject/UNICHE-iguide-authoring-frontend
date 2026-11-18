import { start, go, P } from "./common.mjs";
const vp = process.argv[2];
const s = await start(vp); const { page } = s;
for (const k of ["places","pois","routes","guides","events","categories"]) {
  await go(page, `${P}/${k}`); await page.waitForSelector("tbody tr"); await page.waitForTimeout(500);
  const m = await page.evaluate(()=>{const main=document.querySelector("main"); const t=document.querySelector("table"); const wrap=t.parentElement; const tr=document.querySelector("tbody tr"); const btns=[...tr.querySelectorAll("button")].map(b=>Math.round(b.getBoundingClientRect().height)); return {docScrollX: document.documentElement.scrollWidth>innerWidth, tableScrollX: wrap.scrollWidth>wrap.clientWidth+1, tw:Math.round(t.getBoundingClientRect().width), ww:wrap.clientWidth, rowH:Math.round(tr.getBoundingClientRect().height), mainW: Math.round(main.getBoundingClientRect().width)}});
  console.log(vp,k,JSON.stringify(m));
  if (["pois","places","categories"].includes(k) || vp==="zoom200") await s.shot(`${k}__list-default`);
}
// sticky header test + scroll
await go(page, `${P}/pois`); await page.waitForSelector("tbody tr");
await page.evaluate(()=>{document.querySelector("main").scrollTo(0,2500)}); await page.waitForTimeout(300);
if (vp==="1440"||vp==="1280") await s.shot(`pois__scrolled-no-sticky-header`);
console.log(vp,"nav sticky?", await page.evaluate(()=>{const th=document.querySelector("thead th").getBoundingClientRect().top; const s=document.querySelector("input[type=search]").getBoundingClientRect().top; return {thTop:th, searchTop:s}}));
await s.browser.close();
