import {open,go,P,shot,btns,hdr} from "./lib.mjs";
const { browser, page } = await open("admin",{viewport:"1440"});
await go(page,P+"/media"); await page.waitForSelector("main h1"); await page.waitForTimeout(1500);
await page.getByRole("button",{name:/Filters and sort/}).click(); await page.waitForTimeout(500);
await shot(page,"media__filters-popover__1440");
console.log((await page.evaluate(()=>document.querySelector("[role=dialog],[role=menu],[class*=popover]")?.innerText||"none")).replace(/\n+/g," | "));
console.log(await page.evaluate(()=>[...document.querySelectorAll("select")].map(s=>s.getAttribute("aria-label")||s.id+":"+[...s.options].map(o=>o.text).join("/"))));
await browser.close();
