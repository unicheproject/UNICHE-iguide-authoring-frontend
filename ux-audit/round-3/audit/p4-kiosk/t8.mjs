import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log,rects} from "./lib.mjs"; import {coarse,small} from "./tlib.mjs";
for (const vp of ["1024","768","zoom200"]) {
 const touch=vp!=="zoom200";
 const { browser, context, page } = await open("admin",{viewport:vp,touch}); if(touch) await coarse(page);
 await context.grantPermissions(["clipboard-read","clipboard-write"],{origin:"http://localhost:5173"});
 await go(page,`/projects/${P}/preview`); await page.waitForSelector("[data-preview-frame]",{timeout:20000}); await page.waitForTimeout(1200);
 for (const s of ["Kiosk","Mobile","Web"]) { await page.getByRole("tab",{name:s,exact:true}).tap?.().catch(()=>{}); await page.getByRole("tab",{name:s,exact:true}).click(); await page.waitForTimeout(600);
  const m=await page.evaluate(()=>{const f=document.querySelector("[data-preview-frame]");const h=f.getBoundingClientRect();const rows=[...document.querySelectorAll("main [role=tablist]")].map(t=>{const b=t.getBoundingClientRect();return [t.getAttribute("aria-label"),Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]});const cap=[...document.querySelectorAll("main p,main span")].find(e=>/Shown at|real size/.test(e.textContent)&&e.children.length<3);return {frameTop:Math.round(h.y),hostW:Math.round(h.width),hostH:Math.round(h.height),inner:Math.round(f.firstElementChild.getBoundingClientRect().width),scale:f.dataset.scale,cap:cap?.textContent.trim().replace(/\s+/g," ").slice(0,80),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,rows}});
  log(vp,s,JSON.stringify(m)); await page.screenshot({path:shotp(`preview__${s.toLowerCase()}__${vp}`)}); }
 if(touch){ const r=await small(page,"main"); log(vp,"preview small",JSON.stringify(r.small));
  // interact button measure + active feedback
  const ib=page.getByRole("button",{name:/Interact with the preview/}); log("interact box",await ib.boundingBox());
 }
 await browser.close();
}
