import { open, go, P, shot, settle, IDS, url, txt } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("routes", IDS.route)); await settle(page,1500);
await page.getByRole("button",{name:"Add stops"}).click(); await settle(page,800);
const d = page.getByRole("dialog");
console.log("DIALOG", await d.evaluate(e=>e.innerText.replace(/\n+/g," | ")));
await shot(page,"route__picker-open__1440");
console.log("focus", await page.evaluate(()=>document.activeElement.outerHTML.slice(0,200)));
// live regions
await page.evaluate(()=>{window.__live=[];const o=new MutationObserver(()=>{for(const l of document.querySelectorAll("[aria-live],[role=status],[role=alert]")){const t=l.textContent.trim(); if(t&&window.__live[window.__live.length-1]!==t) window.__live.push(t)}});o.observe(document.body,{subtree:true,childList:true,characterData:true});});
// accent folding
const s = d.getByRole("searchbox").or(d.locator("input[type=search],input[type=text]")).first();
await s.fill("eclair"); await settle(page,600);
console.log("eclair ->", await d.evaluate(e=>e.innerText.replace(/\n+/g," | ").slice(0,300)));
await s.fill("ÉCLAIR"); await settle(page,600);
console.log("ÉCLAIR ->", await d.evaluate(e=>e.innerText.replace(/\n+/g," | ").slice(0,300)));
await s.fill("αγιος"); await settle(page,600);
console.log("αγιος ->", await d.evaluate(e=>e.innerText.replace(/\n+/g," | ").slice(0,300)));
await s.fill("ΑΓΙΟΣ"); await settle(page,600);
console.log("ΑΓΙΟΣ ->", await d.evaluate(e=>e.innerText.replace(/\n+/g," | ").slice(0,300)));
await s.fill("UX-R3-s11"); await settle(page,800);
await shot(page,"route__picker-search__1440");
console.log("html", await d.evaluate(e=>e.innerHTML.slice(0,3500)));
await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await settle(page,400);
console.log("after Enter", await d.evaluate(e=>e.innerText.replace(/\n+/g," | ").slice(0,500)), await page.evaluate(()=>document.activeElement.outerHTML.slice(0,150)));
console.log("live", JSON.stringify(await page.evaluate(()=>window.__live)));
await shot(page,"route__picker-picked__1440");
await browser.close();
