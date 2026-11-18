import { open, go, base, shot } from "./lib.mjs";
for (const vp of ["1440","1024","768"]) {
const { browser, page } = await open("admin", { viewport: vp });
for (const k of ["places","pois","routes","guides","events","categories"]) {
await go(page, base+"/"+k);
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
const r = await page.evaluate(()=>{
  const th=[...document.querySelectorAll("thead th")].map(t=>`${t.innerText.trim()||"-"}:${Math.round(t.getBoundingClientRect().width)}`);
  const rows=[...document.querySelectorAll("tbody tr")].slice(0,10).map(r=>Math.round(r.getBoundingClientRect().height));
  const trCells=[...document.querySelectorAll("tbody tr:nth-child(1) td")].length;
  // translations col: any word break mid-word? check dots link widths vs scrollWidth
  const dots=[...document.querySelectorAll("tbody a[href*='lang=']")].slice(0,3).map(a=>`${a.innerText.trim()} w${Math.round(a.getBoundingClientRect().width)} h${Math.round(a.getBoundingClientRect().height)}`);
  return {th,rowsMax:Math.max(...rows),rowsMed:rows.sort((a,b)=>a-b)[5],dots,hscroll:document.documentElement.scrollWidth>document.documentElement.clientWidth, tw: document.querySelector("table")?.getBoundingClientRect().width};
});
console.log(vp,k,JSON.stringify(r));
if (k==="routes"||k==="pois") await shot(page,`${k}-list__default__${vp}`);
}
await browser.close();
}
