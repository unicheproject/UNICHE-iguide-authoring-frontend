import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const POI="546c5177-effd-49c8-acae-85d751f89bbe";
const log=[]; const L=(k,v)=>{log.push([k,v]);console.log(k,JSON.stringify(v));};
for (const vp of process.argv.slice(2).length?process.argv.slice(2):["1440","1280","1024","768","zoom200"]) {
  const { browser, page } = await open("admin",{viewport:vp});
  await go(page,`/projects/${P}/pois/${POI}`); await page.waitForTimeout(2500);
  const btn=page.getByRole("button",{name:/Preview in app/});
  L(vp+" btn",await btn.count());
  await btn.first().scrollIntoViewIfNeeded();
  const bb=await btn.first().boundingBox(); L(vp+" btnBox",bb);
  await btn.first().click(); await page.waitForTimeout(1500);
  const m=async(tag)=>L(vp+" "+tag,await page.evaluate(()=>{
    const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}};
    const pane=document.querySelector('[role=region][aria-label^=Preview]');
    const panel=pane?.closest('[class*=border]')?.parentElement;
    const btns=[...document.querySelectorAll('button')].filter(b=>/^(Expand|Close|Collapse|Interact|Stop|Open at real)/.test(b.textContent.trim())).map(b=>[b.textContent.trim().slice(0,30),r(b)]);
    const fr=document.querySelector('[data-preview-frame]');
    return {scrollY:Math.round(scrollY),docH:document.documentElement.scrollHeight,vh:innerHeight,region:r(pane),frame:r(fr?.firstElementChild),scale:fr?.dataset.scale,btns,active:document.activeElement.textContent.trim().slice(0,30),cap:pane?.querySelector('p')?.textContent.replace(/\s+/g,' ').trim(),sw:document.documentElement.scrollWidth-document.documentElement.clientWidth};
  }));
  await m("opened");
  await page.screenshot({path:D+`shots/editor-panel__open__${vp}.png`});
  const exp=page.getByRole("button",{name:/^Expand/});
  if(await exp.count()){
    const eb=await exp.first().boundingBox(); L(vp+" expandBox(viewport)",eb);
    await exp.first().scrollIntoViewIfNeeded(); const y0=await page.evaluate(()=>scrollY);
    await exp.first().click(); await page.waitForTimeout(1200);
    const y1=await page.evaluate(()=>scrollY); L(vp+" expandScrollDelta",y1-y0);
    await m("expanded"); await page.screenshot({path:D+`shots/editor-panel__expanded__${vp}.png`});
    L(vp+" focusAfterExpand",await page.evaluate(()=>document.activeElement.textContent.trim().slice(0,30)));
    await page.keyboard.press("Escape"); await page.waitForTimeout(700); await m("afterEsc1");
    L(vp+" panelStillThere",await page.locator('[role=region][aria-label^=Preview]').count());
  }
  await page.keyboard.press("Escape"); await page.waitForTimeout(700); await m("afterEsc2");
  L(vp+" focusAfterClose",await page.evaluate(()=>document.activeElement.textContent.trim().slice(0,40)));
  await browser.close();
}
writeFileSync(D+"a6-"+(process.argv[2]||"all")+".json",JSON.stringify(log,null,1));
