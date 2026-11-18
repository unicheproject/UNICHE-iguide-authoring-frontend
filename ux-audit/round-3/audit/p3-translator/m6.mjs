import { open, go, base, shot } from "./lib.mjs";
for (const vp of ["1440","1024","768"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, base+`/media?view=list&lang=it&missing=it`); await page.waitForSelector("h1"); await page.waitForTimeout(2200);
await shot(page,`media__list-view-italian-worklist__${vp}`);
console.log(vp, await page.evaluate(()=>{const rows=[...document.querySelectorAll("tbody tr")].slice(0,3).map(r=>r.innerText.replace(/\s+/g," ")); const th=[...document.querySelectorAll("thead th")].map(t=>(t.innerText.trim()||"-")+":"+Math.round(t.getBoundingClientRect().width)); return JSON.stringify({th,rows,hs:document.documentElement.scrollWidth>document.documentElement.clientWidth})}));
await browser.close();
}
