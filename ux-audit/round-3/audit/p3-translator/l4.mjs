import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
for (const vp of ["1440","1024","768","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, base+"/routes");
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
await page.getByPlaceholder(/Search/).first().fill("UX-R3-p3 Route");
await page.waitForTimeout(1800);
await shot(page,`routes-list__my-long-greek-row__${vp}`);
const lr = await page.evaluate(()=>{ const a=document.querySelector("tbody tr a, main a[href*='/routes/']"); const rr=a.closest("tr,li,article,div[class*=row]"); const t=a.getBoundingClientRect(); return {titleH:Math.round(t.height), titleW:Math.round(t.width), rowH: rr?Math.round(rr.getBoundingClientRect().height):null, lines: Math.round(t.height/parseFloat(getComputedStyle(a).lineHeight)), overflowX: a.scrollWidth>a.clientWidth, hs: document.documentElement.scrollWidth>document.documentElement.clientWidth}});
console.log(vp,"list",JSON.stringify(lr));
await go(page, R.routes);
await page.waitForSelector("h1"); await page.waitForTimeout(2000);
await shot(page,`route-editor__long-greek-title__${vp}`);
const er = await page.evaluate(()=>{ const h=document.querySelector("h1"); const b=h.getBoundingClientRect(); const t=document.querySelector("#f-title"); const tb=t.getBoundingClientRect(); const chips=[...document.querySelectorAll("header *")].filter(e=>e.children.length===0&&/Draft/.test(e.innerText||"")).map(e=>Math.round(e.getBoundingClientRect().y)); return {h1H:Math.round(b.height), h1W:Math.round(b.width), lines:Math.round(b.height/parseFloat(getComputedStyle(h).lineHeight)), titleField:{h:Math.round(tb.height), sh:t.scrollHeight, ch:t.clientHeight, tag:t.tagName, rows:t.rows}, hs: document.documentElement.scrollWidth>document.documentElement.clientWidth, h1clamp:getComputedStyle(h).webkitLineClamp, h1ov:getComputedStyle(h).overflow, chipY:chips}});
console.log(vp,"editor",JSON.stringify(er));
await browser.close();
}
