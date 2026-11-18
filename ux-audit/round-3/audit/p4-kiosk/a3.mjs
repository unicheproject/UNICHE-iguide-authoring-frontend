import { open, go } from "../../../tools/session.mjs"; import {P,shotp,log,rects} from "./lib.mjs";
const { browser, context, page } = await open("admin",{viewport:"1440"});
const errs=[]; page.on("pageerror",e=>errs.push(String(e)));
await go(page,`/projects/${P}/preview`);
await page.waitForSelector("[data-preview-frame]",{timeout:20000}); await page.waitForTimeout(1200);
const status=()=>page.evaluate(()=>{const m=document.querySelector("main");return {live:[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim().slice(0,100)).filter(Boolean), lines:[...m.querySelectorAll("p")].map(p=>p.textContent.trim().replace(/\s+/g," ").slice(0,160)).slice(0,8), url:location.search}});
// Mobile
await page.getByRole("tab",{name:"Mobile",exact:true}).click(); await page.waitForTimeout(700);
log("mobile",await status());
log("mobile frame",await page.evaluate(()=>{const f=document.querySelector("[data-preview-frame]");const b=f.firstElementChild.getBoundingClientRect();const h=f.getBoundingClientRect();return {w:b.width,h:b.height,hostX:h.x,hostW:h.width,x:b.x,scale:f.dataset.scale}}));
await page.screenshot({path:shotp("preview__mobile__1440")});
// options in select
const opts=await page.locator("main select option").allTextContents(); log("mobile options",opts.length,opts.filter(o=>/beacon|Bluetooth/i.test(o)).slice(0,3), opts.slice(0,2));
// fire a beacon
const sel=page.locator("main select");
const beac=await sel.locator("option",{hasText:/beacon/i}).first().getAttribute("value");
await sel.selectOption(beac); await page.getByRole("button",{name:/^Fire/}).click(); await page.waitForTimeout(800);
log("fired beacon",await status());
await page.screenshot({path:shotp("preview__mobile-fired-beacon__1440")});
log("chip",await page.evaluate(`(${rects})("main button")`).then(a=>a.filter(x=>/Reset|Fired|Clear/i.test(x.t))));
// Reset
const reset=page.getByRole("button",{name:/Reset/}); log("reset count",await reset.count());
if(await reset.count()){await reset.first().click();await page.waitForTimeout(500);log("after reset focus",await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.getAttribute("aria-label")||document.activeElement.textContent||"").trim().slice(0,40)));}
// Web QR
await page.getByRole("tab",{name:"Web",exact:true}).click(); await page.waitForTimeout(500);
const qr=await sel.locator("option",{hasText:/^QR code/}).first().getAttribute("value");
await sel.selectOption(qr); await page.getByRole("button",{name:/^Fire/}).click(); await page.waitForTimeout(800);
log("fired qr web",await status()); await page.screenshot({path:shotp("preview__web-fired-qr__1440")});
// geo
const geoOpt=sel.locator("option",{hasText:/geo|proximity/i});log("geo options",await geoOpt.count());
if(await geoOpt.count()){await sel.selectOption(await geoOpt.first().getAttribute("value"));await page.getByRole("button",{name:/^Fire/}).click();await page.waitForTimeout(700);log("fired geo",await status());await page.screenshot({path:shotp("preview__web-fired-geo__1440")});}
// Language
await page.getByRole("tab",{name:"Ελληνικά"}).click(); await page.waitForTimeout(700);
log("greek",await status()); await page.screenshot({path:shotp("preview__greek-web__1440")});
// Live
await page.getByRole("tab",{name:"Live",exact:true}).click(); await page.waitForTimeout(1200);
log("live",await status()); await page.screenshot({path:shotp("preview__live-greek__1440")});
await page.getByRole("tab",{name:"Working",exact:true}).click();
await page.getByRole("tab",{name:"English"}).click();
// Interact / Esc
const btn=page.getByRole("button",{name:/Interact with the preview/});
await btn.focus(); await page.screenshot({path:shotp("preview__interact-focus__1440")});
await btn.click(); await page.waitForTimeout(400);
log("interacting",await page.evaluate(()=>[...document.querySelectorAll("main button")].filter(b=>/Stop/.test(b.textContent)).map(b=>b.textContent.trim())), await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.textContent||"").trim().slice(0,30)));
await page.screenshot({path:shotp("preview__interacting__1440")});
await page.keyboard.press("Tab"); log("tab in frame focus",await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.textContent||"").trim().slice(0,30)));
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
log("after esc",await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.textContent||"").trim().slice(0,40)));
// skip link
await page.locator("body").press("Tab"); 
const skip=page.getByRole("link",{name:/Skip preview/}); log("skip count",await skip.count(), await skip.evaluate(e=>{const b=e.getBoundingClientRect();return [b.x,b.y,b.width,b.height,getComputedStyle(e).position]}));
await skip.focus(); await page.screenshot({path:shotp("preview__skip-focus__1440")});
log("skip box focused",await skip.evaluate(e=>{const b=e.getBoundingClientRect();return [b.x,b.y,b.width,b.height]}));
await skip.press("Enter"); await page.waitForTimeout(300); log("after skip focus",await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.textContent||"").trim().slice(0,40)+" y="+Math.round(document.activeElement.getBoundingClientRect().y)));
// Open in new tab with state
const [np]=await Promise.all([context.waitForEvent("page"),page.getByRole("button",{name:/Open in new tab/}).click()]);
await np.waitForLoadState("networkidle").catch(()=>{}); await np.waitForTimeout(1500);
log("newtab url",np.url()); await np.screenshot({path:shotp("newtab__default__1440")});
await np.close();
log(errs);
await browser.close();
