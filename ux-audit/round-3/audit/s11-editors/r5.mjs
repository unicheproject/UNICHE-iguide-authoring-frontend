import { open, go, P, shot, settle, IDS, url, txt, routeWithStops } from "./lib.mjs";
const vp = process.argv[2]||"1440";
const { browser, page } = await open("admin", { viewport: vp });
await routeWithStops(page);
await page.evaluate(()=>{window.__live={};const f=()=>{for(const l of document.querySelectorAll("[aria-live],[role=status],[role=alert]")){const t=l.textContent.trim(); const k=(l.className||"").slice(0,30)+"|"+l.getAttribute("role"); (window.__live[k]??=[]); if(t&&window.__live[k].at(-1)!==t) window.__live[k].push(t)}};new MutationObserver(f).observe(document.body,{subtree:true,childList:true,characterData:true});});
const rows = page.locator("li[data-stop-row]");
// keyboard reorder via handle
await page.locator("#stop-new-2-handle").focus();
await page.keyboard.press("ArrowUp"); await settle(page,300);
console.log("after ArrowUp order:", await rows.evaluateAll(es=>es.map(e=>e.querySelector("a").textContent.trim())), "focus:", await page.evaluate(()=>document.activeElement.id||document.activeElement.outerHTML.slice(0,100)));
console.log("live reorder", JSON.stringify(await page.evaluate(()=>window.__live)));
// position select
await page.locator("select[id$=-position]").nth(0).selectOption("3"); await settle(page,300);
console.log("after select:", await rows.evaluateAll(es=>es.map(e=>e.querySelector("a").textContent.trim())));
// hover metrics
const mv = page.locator("[id$=-move-down]").nth(1);
await mv.scrollIntoViewIfNeeded();
const cs = ()=>mv.evaluate(e=>{const s=getComputedStyle(e);return s.backgroundColor+" "+s.color+" "+s.opacity+" "+s.cursor});
console.log("rest", await cs()); await mv.hover(); await settle(page,200); console.log("hover", await cs());
await shot(page,`route__move-hover__${vp}`);
await page.mouse.down(); console.log("active", await cs()); await page.mouse.up();
const h = page.locator("[id$=-handle]").nth(1); await h.hover(); console.log("handle hover", await h.evaluate(e=>getComputedStyle(e).backgroundColor+" "+getComputedStyle(e).cursor));
const first = page.locator("[id$=-move-up]").first(); console.log("disabled first up", await first.evaluate(e=>{const s=getComputedStyle(e);return e.disabled+" opacity "+s.opacity+" color "+s.color+" cursor "+s.cursor}));
const last = page.locator("[id$=-move-down]").last(); console.log("disabled last down", await last.evaluate(e=>{const s=getComputedStyle(e);return e.disabled+" opacity "+s.opacity}));
// remove via click
const rm = page.getByRole("button",{name:/^Remove stop 2/});
await rm.scrollIntoViewIfNeeded(); await rm.hover(); console.log("rm hover", await rm.evaluate(e=>getComputedStyle(e).backgroundColor));
await rm.click(); await settle(page,500);
console.log("focus after remove", await page.evaluate(()=>{const a=document.activeElement;return a.id+" | "+a.tagName+" | "+(a.getAttribute("aria-label")||a.textContent.trim().slice(0,60))}));
const bar = await page.evaluate(()=>{const b=[...document.querySelectorAll("[role=status],[role=alert],div")].find(e=>/Undo/.test(e.textContent)&&e.querySelector("button")&&e.getBoundingClientRect().height<120&&e.getBoundingClientRect().height>20&&/removed/i.test(e.textContent)); if(!b) return null; const r=b.getBoundingClientRect(); return {txt:b.textContent.trim().slice(0,120), top:r.top,bottom:r.bottom,h:r.height,left:r.left,w:r.width,vh:innerHeight,pos:getComputedStyle(b).position}});
console.log("undo bar", JSON.stringify(bar));
await shot(page,`route__undo-bar__${vp}`);
console.log("live remove", JSON.stringify(await page.evaluate(()=>window.__live)));
await page.keyboard.press("Control+z"); await settle(page,400);
console.log("after ctrl+z", await rows.count(), await page.evaluate(()=>document.activeElement.id||document.activeElement.outerHTML.slice(0,80)));
await page.getByRole("button",{name:/^Remove stop 1/}).click(); await settle(page,300);
await page.getByRole("button",{name:/^Undo/}).first().click(); await settle(page,300);
console.log("after undo click", await rows.count(), await page.evaluate(()=>document.activeElement.id||document.activeElement.outerHTML.slice(0,80)));
await browser.close();
