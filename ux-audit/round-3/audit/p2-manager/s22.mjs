import { open, go } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const POP="6958c18f-60d2-4140-a524-5a43f8a2f6b5", EB="1d6971ce-6391-4da8-848e-8d7466d25128";
async function walk(page, label, max=40) {
  const out=[]; 
  for (let i=0;i<max;i++){ await page.keyboard.press("Tab");
    const r = await page.evaluate(()=>{const e=document.activeElement; if(!e||e===document.body) return null; const cs=getComputedStyle(e); const b=e.getBoundingClientRect(); return {n:(e.getAttribute("aria-label")||e.innerText||e.tagName).trim().replace(/\s+/g," ").slice(0,40), tag:e.tagName, ol:cs.outlineStyle+" "+cs.outlineWidth+" "+cs.outlineColor, bs:cs.boxShadow.slice(0,40), vis:b.top>=0&&b.bottom<=innerHeight, w:Math.round(b.width), h:Math.round(b.height)}});
    out.push(r); }
  console.log("== TAB WALK", label); console.log(out.map((r,i)=>i+1+" "+JSON.stringify(r)).join("\n"));
}
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/"+EB); await page.waitForTimeout(2500);
await page.keyboard.press("Tab"); await shot(page,"keyboard__skiplink-focus__1440");
await walk(page, "Empty B dashboard", 36);
await shot(page,"keyboard__dashboard-emptyb-after-walk__1440");
await go(page, "/projects/new"); await page.waitForTimeout(1500);
await walk(page, "wizard step1", 14);
await shot(page,"keyboard__wizard-step1-focus__1440");
await browser.close();
