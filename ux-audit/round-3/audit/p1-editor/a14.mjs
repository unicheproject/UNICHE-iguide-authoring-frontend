import {open,go,P,shot,btns,hdr} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
// Dashboard
let t=Date.now();
await go(page,P); await page.waitForSelector("text=Waiting for you to apply",{timeout:15000});
console.log("dashboard ready ms",Date.now()-t);
await page.waitForTimeout(800);
await shot(page,"dashboard__waiting-to-apply__1440");
const w=await page.evaluate(()=>{const h=[...document.querySelectorAll("h2,h3")].find(e=>/Waiting for you/.test(e.innerText));const c=h.closest("section,div[class*=card],article")||h.parentElement.parentElement;return c.innerText.slice(0,900)});
console.log(w);
// list toggle
await go(page,P+"/pois"); await page.waitForTimeout(800);
await page.getByRole("button",{name:/Filters and sort/}).click(); await page.waitForTimeout(400);
await shot(page,"pois-list__filters-popover__1440");
console.log((await page.evaluate(()=>document.querySelector("[role=dialog],[role=menu],[data-popover],[class*=popover]")?.innerText||"none")).slice(0,800));
console.log(await btns(page,"body"));
await browser.close();
