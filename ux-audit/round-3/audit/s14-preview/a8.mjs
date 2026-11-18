import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const log=[]; const L=(k,v)=>{log.push([k,v]);console.log(k,JSON.stringify(v));};
const { browser, context, page } = await open("admin",{viewport:"1024"});
await go(page,`/projects/${P}/app-preview`); await page.waitForTimeout(1500);
const f=()=>page.evaluate(()=>{const f=document.querySelector('[data-preview-frame]');return {scale:f.dataset.scale,w:Math.round(f.firstElementChild.getBoundingClientRect().width),url:location.search,checked:document.querySelector('header input[type=checkbox]')?.checked,aria:document.querySelector('header [role=checkbox]')?.getAttribute('aria-checked')}});
L("before",await f());
await page.getByText("Open at real size").click(); await page.waitForTimeout(800);
L("afterRealClick",await f());
await page.screenshot({path:D+"shots/newtab__real-size-click__1024.png"});
// keyboard path
await go(page,`/projects/${P}/app-preview`); await page.waitForTimeout(1500);
const seq=[];for(let i=0;i<9;i++){await page.keyboard.press("Tab");seq.push(await page.evaluate(()=>{const a=document.activeElement;return a.tagName+':'+(a.id||a.getAttribute('aria-label')||a.textContent).trim().slice(0,30)}));}
L("kbd",seq);
// From Preview page: open in new tab with Kiosk landscape + 100 %
await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1500);
await page.getByRole("tab",{name:"Kiosk",exact:true}).click(); await page.getByRole("tab",{name:"Landscape"}).click();
const [pop]=await Promise.all([context.waitForEvent("page"),page.getByRole("button",{name:/Open in new tab/}).click()]);
await pop.waitForLoadState("networkidle").catch(()=>{}); await pop.waitForTimeout(1500);
L("popup",{url:pop.url(),frame:await pop.evaluate(()=>{const f=document.querySelector('[data-preview-frame]');const b=f.firstElementChild.getBoundingClientRect();return {w:Math.round(b.width),h:Math.round(b.height),scale:f.dataset.scale}})});
await pop.screenshot({path:D+"shots/newtab__from-preview-kiosk-landscape__1024.png"});
await pop.close();
await browser.close();
writeFileSync(D+"a8.json",JSON.stringify(log,null,1));
