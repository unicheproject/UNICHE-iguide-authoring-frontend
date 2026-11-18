import { open, go } from "../../../tools/session.mjs";
import { writeFileSync, readFileSync } from "node:fs";
const P="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const D="ux-audit/round-3/audit/s14-preview/";
const T=JSON.parse(readFileSync(D+"triggers.json"));
const qrA=T.find(t=>t.type==="QR_CODE"&&t.status==="ACTIVE"), qrD=T.find(t=>t.type==="QR_CODE"&&t.status==="DRAFT"), bc=T.find(t=>t.type==="BEACON"), geo=T.find(t=>t.type==="GEO_PROXIMITY");
const arch=null;
const log=[]; const L=(k,v)=>{log.push([k,v]);console.log(k,JSON.stringify(v));};
const { browser, page } = await open("admin",{viewport:"1440"});
const state=()=>page.evaluate(()=>({surf:[...document.querySelectorAll('[role=tablist][aria-label=Surface] [aria-selected=true]')].map(x=>x.textContent),mode:[...document.querySelectorAll('[role=tablist][aria-label=Content] [aria-selected=true]')].map(x=>x.textContent),sel:document.getElementById('fire-trigger')?.selectedOptions[0]?.textContent,chip:[...document.querySelectorAll('span')].find(e=>/^Fired:/.test(e.textContent.trim()))?.textContent,notes:[...document.querySelectorAll('[role=status]')].map(e=>e.textContent.trim()).filter(t=>/trigger|link/i.test(t)),y:document.querySelector('[data-preview-frame]')?.getBoundingClientRect().top,scrollY,url:location.search,standIn:document.querySelector('[data-preview-frame] [class*=origin-top-left]')?.innerText.replace(/\s+/g,' ').slice(0,160)}));
for (const [n,t] of [["beacon",bc],["qrDraft",qrD],["qrActive",qrA],["geo",geo],["unknown",{id:"00000000-0000-4000-8000-000000000000"}],["garbage",{id:"not-a-uuid"}]]) {
  await go(page,`/projects/${P}/preview?trigger=${t.id}`); await page.waitForTimeout(1800);
  L("deep-"+n,await state());
  await page.screenshot({path:D+`shots/preview__deeplink-${n}__1440.png`});
}
// Live + draft deep link? ?mode=live not supported on page; skip
// missing titles
await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1200);
await page.getByRole("tab",{name:"Italiano"}).click(); await page.waitForTimeout(500);
await page.locator("details summary").scrollIntoViewIfNeeded();
L("missingSummary",await page.locator("details summary").innerText());
await page.locator("details summary").click(); await page.waitForTimeout(300);
await page.screenshot({path:D+"shots/preview__missing-titles-open__1440.png",fullPage:true});
L("missingLinks",await page.locator("details a").evaluateAll(a=>a.map(x=>[x.textContent.trim(),x.getAttribute("href")])));
L("summaryStyle",await page.locator("details summary").evaluate(s=>{const cs=getComputedStyle(s);const b=s.getBoundingClientRect();return {fs:cs.fontSize,fw:cs.fontWeight,col:cs.color,h:b.height,w:b.width,cursor:cs.cursor,deco:cs.textDecorationLine}}));
// click through link
await page.locator("details a").first().click(); await page.waitForTimeout(1500);
L("afterLink",page.url());
await page.screenshot({path:D+"shots/preview__missing-link-target__1440.png"});
// Greek
await go(page,`/projects/${P}/preview`); await page.waitForTimeout(1000);
await page.getByRole("tab",{name:"Ελληνικά"}).click(); await page.waitForTimeout(500);
L("greekSummary",await page.locator("details summary, p:has-text('No missing')").first().innerText());
await page.screenshot({path:D+"shots/preview__greek__1440.png"});
await browser.close();
writeFileSync(D+"a5.json",JSON.stringify(log,null,1));
