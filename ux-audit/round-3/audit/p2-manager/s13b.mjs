import { open, go } from "../../../tools/session.mjs";
const ID="600c4311-3e81-4235-91b0-5b3e336918fc";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, "/projects/"+ID);
await page.waitForTimeout(2500);
console.log(page.url());
console.log(await page.evaluate(()=>[...document.querySelectorAll("main a, main button")].slice(0,12).map(e=>e.tagName+":"+e.innerText.trim().slice(0,30)+":"+(e.getAttribute("href")||""))));
console.log(await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,300)));
await browser.close();
