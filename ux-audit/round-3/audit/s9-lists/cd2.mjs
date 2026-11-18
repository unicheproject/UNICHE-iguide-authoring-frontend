import { open, go, P, shot, settle } from "./h.mjs";
for (const vp of ["768","zoom200"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/guides`); await settle(page, 2000);
console.log(vp, "list html:", await page.evaluate(() => { const m=document.querySelector("main"); return [...m.querySelectorAll("ul,ol,table")].slice(0,3).map(x=>x.tagName+"."+x.className.slice(0,80)+" items="+x.children.length).join(" ; "); }));
await page.getByRole("button", { name: /Filters/ }).first().click(); await settle(page, 600);
console.log(vp, "popover:", await page.evaluate(() => { const d=document.querySelector("[role=dialog]"); const b=d.getBoundingClientRect(); return { r:[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)], text:d.innerText.replace(/\n+/g," | "), seg: !!d.querySelector("fieldset") }; }));
await shot(page, `guides__filters-open__${vp}`);
await page.keyboard.press("Escape");
const info = await page.evaluate(() => { const m=document.querySelector("main"); const t=[...m.querySelectorAll("*")].find(e=>/Not archived/.test(e.textContent) && e.children.length===0); return t ? t.outerHTML.slice(0,200) + " vis=" + (t.offsetWidth>0) : "none"; });
console.log(vp, "Not archived el:", info);
await browser.close();
}
