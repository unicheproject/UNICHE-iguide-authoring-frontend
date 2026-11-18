import {open,go,P,shot,btns,hdr} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
const A=P+"/pois/d2e48820-a468-4539-9f62-545eed5b06a6";
await go(page,A); await page.waitForTimeout(1200);
await shot(page,"poi-editor__active-clean__1440");
const bs=await page.evaluate(()=>[...document.querySelectorAll("main button")].filter(b=>/Apply|Save|Discard/.test(b.innerText)).map(b=>({t:b.innerText.replace(/\s+/g," "),dis:b.disabled||b.getAttribute("aria-disabled"),v:b.dataset.variant,bg:getComputedStyle(b).backgroundColor,op:getComputedStyle(b).opacity,desc:b.getAttribute("aria-describedby")})));
console.log("clean:",JSON.stringify(bs));
await page.locator("#f-summary").fill("Alpha summary EDITED through the working copy.");
await page.waitForTimeout(400);
await shot(page,"poi-editor__active-dirty__1440");
const bs2=await page.evaluate(()=>[...document.querySelectorAll("main button")].filter(b=>/Apply|Save|Discard/.test(b.innerText)).map(b=>({t:b.innerText.replace(/\s+/g," "),dis:b.disabled||b.getAttribute("aria-disabled"),v:b.dataset.variant,bg:getComputedStyle(b).backgroundColor})));
console.log("dirty:",JSON.stringify(bs2));
console.log(await hdr(page));
const t=Date.now();
await page.keyboard.press("Control+s");
const seen=[];let last="";
for(let i=0;i<120;i++){const h=await page.evaluate(()=>[...document.querySelectorAll("[aria-live=polite]")].map(e=>e.innerText.trim()).filter(Boolean).join(" / ")); if(h!==last){seen.push([Date.now()-t,h]);last=h} await page.waitForTimeout(50);}
console.log(JSON.stringify(seen));
console.log("toasts:",await page.evaluate(()=>[...document.querySelectorAll("li[role=status],[data-toast]")].map(e=>e.innerText.trim().slice(0,80))));
await shot(page,"poi-editor__active-draft-saved__1440");
console.log(await page.evaluate(()=>document.querySelector("main").innerText.slice(0,500)));
// leave: via list
await page.getByRole("link",{name:"Points of Interest"}).first().click();
await page.waitForTimeout(1500);
console.log("leave dialog?",await page.getByRole("dialog").count(), page.url());
await browser.close();
