import { open, go, bearer, API } from "../../../tools/session.mjs"; import {P,shotp,log,rects} from "./lib.mjs";
const { browser, context, page } = await open("admin",{viewport:"1440"});
const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
const auth=await bearer(page);
const r=await page.request.get(`${API}/projects/${P}/triggers?size=200`,{headers:{authorization:auth}}).catch(e=>null);
let trig=[]; if(r&&r.ok()){const j=await r.json(); trig=j.content??j; log("triggers",trig.length, Object.keys(trig[0]||{}).join(","));}
else log("trig status",r&&r.status());
const qr=trig.find(t=>t.triggerType==="QR_CODE"&&t.status==="ACTIVE")||trig.find(t=>t.triggerType==="QR_CODE");
log("qr",qr&&{id:qr.id,code:qr.code,status:qr.status});
const go1=async(u,n,vp)=>{await go(page,u);await page.waitForTimeout(3500);log(n,page.url().replace(/.*5173/,""),"title:",await page.title());
 log("  text:",(await page.locator("body").innerText()).slice(0,300).replace(/\s+/g," "));await page.screenshot({path:shotp(n)});};
const base=`/projects/${P}/app-preview`;
await go1(`${base}?surface=KIOSK&lang=el&mode=LIVE&orientation=landscape`,"newtab__kiosk-el-live-landscape__1440");
await go1(`${base}?surface=MOBILE&lang=EL&t=${qr?.code}`,"newtab__mobile-t__1440");
await go1(`${base}?surface=bogus&lang=xx&mode=zzz&t=nope`,"newtab__bad-params__1440");
await go1(`/projects/${P}/preview?trigger=${qr?.id}`,"preview__trigger-qr__1440");
await go1(`/projects/${P}/preview?trigger=${qr?.id}x`,"preview__trigger-bad__1440");
log(errs); await browser.close();
