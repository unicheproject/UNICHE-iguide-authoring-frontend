import { open, go } from "../../../tools/session.mjs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5", POI="546c5177-effd-49c8-acae-85d751f89bbe";
const D="ux-audit/round-3/audit/s14-preview/";
for (const vp of ["1024","1440"]) {
 const s=await open("admin",{viewport:vp}); const page=s.page;
 await go(page,`/projects/${P}/pois/${POI}`); await page.waitForTimeout(2200);
 const act=()=>page.evaluate(()=>document.activeElement.textContent.trim().slice(0,30));
 await page.getByRole("button",{name:/Preview in app/}).first().click(); await page.waitForTimeout(1000);
 for (const surf of ["Kiosk","Mobile"]) {
  await page.getByRole("tab",{name:surf,exact:true}).click(); await page.waitForTimeout(500);
  console.log(vp,surf,await page.evaluate(()=>{const f=document.querySelector('[data-preview-frame]');const c=document.querySelector('[role=region][aria-label^=Preview] p').textContent.replace(/\s+/g,' ');return {scale:f.dataset.scale,cap:c,h:Math.round(f.getBoundingClientRect().height)}}));
  await page.screenshot({path:D+`shots/editor-panel__${surf.toLowerCase()}__${vp}.png`});
 }
 await page.getByRole("button",{name:/^Interact/}).click(); await page.waitForTimeout(300);
 console.log(vp,"interacting focus",await act());
 await page.keyboard.press("Escape"); await page.waitForTimeout(400); console.log(vp,"esc1",await act(),"panel",await page.locator('[role=region][aria-label^=Preview]').count());
 await page.keyboard.press("Escape"); await page.waitForTimeout(600); console.log(vp,"esc2",await act(),"panel",await page.locator('[role=region][aria-label^=Preview]').count());
 // reopen, Close button focus
 await page.getByRole("button",{name:/Preview in app/}).first().click(); await page.waitForTimeout(800);
 await page.getByRole("button",{name:/Close preview/}).click(); await page.waitForTimeout(500); console.log(vp,"closeBtn focus",await act());
 await s.browser.close();
}
