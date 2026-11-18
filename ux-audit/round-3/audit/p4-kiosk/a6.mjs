import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log,rects,here} from "./lib.mjs";
import fs from "node:fs";
const trig=JSON.parse(fs.readFileSync(here+"/trig.json","utf8"));
const qr=trig.find(t=>t.triggerType==="QR_CODE"&&t.status==="ACTIVE"&&t.targetResourceType==="POI"&&t.targetResourceId==="40cab7b2-a7f7-4057-b56e-5605a589156f");
log("qr supported",qr.supportedSurfaces);
const { browser, context, page } = await open("admin",{viewport:"1440"});
await context.grantPermissions(["clipboard-read","clipboard-write"],{origin:"http://localhost:5173"});
const url=`/projects/${P}/pois/${qr.targetResourceId}`;
await go(page,url); await page.getByRole("heading",{name:/How visitors reach it/}).scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
// Copy
await page.getByRole("button",{name:"Copy link"}).click(); await page.waitForTimeout(500);
log("clipboard",await page.evaluate(()=>navigator.clipboard.readText()));
log("toast",await page.evaluate(`(${rects})("[role=status],[role=alert],[data-sonner-toast],li[role=status]")`));
log("toast text",await page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert]")].map(e=>e.textContent.trim().slice(0,120))));
await page.screenshot({path:shotp("poi-triggers__copied-toast__1440")});
log("copy btn label after",await page.getByRole("button",{name:/Cop(y|ied)/}).first().innerText());
// Download
const [dl]=await Promise.all([page.waitForEvent("download",{timeout:8000}).catch(()=>null),page.getByRole("link",{name:/Download PNG/}).click()]);
log("download",dl&&dl.suggestedFilename());
if(dl){const p=await dl.path(); log("dl size",fs.statSync(p).size);}
// open link
const ol=page.getByRole("link",{name:/Open link/}); log("open link",await ol.getAttribute("href"),await ol.getAttribute("target"),await ol.getAttribute("rel"));
// QR image alt, src type
log("qr img",await page.locator("main img").filter({has:page.locator(":scope")}).evaluateAll(a=>a.filter(i=>i.width>=100&&i.width<=140).map(i=>({alt:i.alt,w:i.width,nw:i.naturalWidth,src:i.src.slice(0,30)}))));
await page.getByRole("link",{name:"Test in preview for QR code"}).click(); await page.waitForTimeout(3500);
log("after test url",page.url().replace(/.*5173/,""));
log("sel state",await page.evaluate(()=>({tabs:[...document.querySelectorAll("main [role=tab]")].map(t=>t.textContent.trim()+(t.getAttribute("aria-selected")==="true"?"*":"")).join("|"),sel:document.querySelector("main select")?.selectedOptions[0]?.textContent,chip:[...document.querySelectorAll("main span")].map(s=>s.textContent.trim()).filter(t=>/^Fired/.test(t)),active:document.activeElement.tagName+":"+(document.activeElement.textContent||"").trim().slice(0,30)})));
await page.screenshot({path:shotp("preview__from-test-in-preview-qr__1440")});
// back
await page.goBack(); await page.waitForTimeout(2500); log("back url",page.url().replace(/.*5173/,""), "scrollY",await page.evaluate(()=>document.querySelector("main")?.scrollTop));
// geo + beacon trigger test
const geo=trig.find(t=>t.triggerType==="GEO_PROXIMITY"&&t.status==="ACTIVE"); const bc=trig.find(t=>t.triggerType==="BLUETOOTH_BEACON"&&t.status==="ACTIVE")||trig.find(t=>/BEACON/.test(t.triggerType));
log("types",[...new Set(trig.map(t=>t.triggerType))], geo&&geo.supportedSurfaces, bc&&[bc.triggerType,bc.supportedSurfaces,bc.targetResourceType,bc.targetResourceId]);
for (const [n,t] of [["geo",geo],["beacon",bc]]) { if(!t)continue;
  await go(page,`/projects/${P}/preview?trigger=${t.id}`); await page.waitForTimeout(3500);
  log(n,"sel",await page.evaluate(()=>({tabs:[...document.querySelectorAll("main [role=tab]")].filter(t=>t.getAttribute("aria-selected")==="true").map(t=>t.textContent.trim()).join("|"),chip:[...document.querySelectorAll("main span")].map(s=>s.textContent.trim()).filter(t=>/^Fired/.test(t))})));
  await page.screenshot({path:shotp(`preview__trigger-${n}__1440`)});}
await browser.close();
