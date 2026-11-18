import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log,rects} from "./lib.mjs";
const vp=process.argv[2]||"1440";
const { browser, page } = await open("admin",{viewport:vp});
const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
await go(page,`/projects/${P}/preview`);
await page.waitForSelector("[data-preview-frame]",{timeout:20000}); await page.waitForTimeout(1500);
const meas=()=>page.evaluate(()=>{
 const f=document.querySelector("[data-preview-frame]"); const inner=f.firstElementChild; const b=inner.getBoundingClientRect(); const h=f.getBoundingClientRect();
 const cap=[...document.querySelectorAll("main p,main span,main div")].find(e=>/Shown at|Fits at real size|Real size|real size/.test(e.textContent||"")&&e.children.length<3);
 return {frameW:Math.round(b.width*10)/10, frameH:Math.round(b.height), hostW:Math.round(h.width), hostH:Math.round(h.height), top:Math.round(h.y), scale:f.dataset.scale, docSW:document.documentElement.scrollWidth, docCW:document.documentElement.clientWidth, hostSW:f.scrollWidth, cap:(cap?.textContent||"").trim().replace(/\s+/g," ").slice(0,140), tabs:[...document.querySelectorAll("main [role=tab]")].map(t=>t.textContent.trim()+(t.getAttribute("aria-selected")==="true"?"*":"")).join("|")};
});
for (const s of ["Kiosk","Mobile","Web"]) {
  await page.getByRole("tab",{name:s,exact:true}).click(); await page.waitForTimeout(700);
  for (const z of ["Fit width","100 %","50 %"]) {
    const t=page.getByRole("tab",{name:z,exact:true});
    if(!(await t.count())){log(s,z,"(absent)");continue;}
    await t.click(); await page.waitForTimeout(500);
    const m=await meas(); log(s,z,m);
    await page.screenshot({path:shotp(`preview__${s.toLowerCase()}-${z.replace(/[ %]/g,"")}__${vp}`)});
  }
}
log(errs);
await browser.close();
