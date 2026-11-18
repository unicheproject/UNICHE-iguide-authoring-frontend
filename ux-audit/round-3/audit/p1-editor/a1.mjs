import { open, go } from "../../../tools/session.mjs";
const P="/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin",{viewport:"1440"});
await go(page, P+"/pois");
await page.waitForTimeout(2000);
await page.screenshot({path:"shots/pois-list__default__1440.png"});
const info = await page.evaluate(()=>({h1:document.querySelector("h1")?.innerText, btns:[...document.querySelectorAll("button,a")].slice(0,60).map(b=>(b.getAttribute("aria-label")||b.innerText||"").trim().slice(0,40)).filter(Boolean), rows:document.querySelectorAll("tbody tr").length, url:location.href}));
console.log(JSON.stringify(info,null,1));
await browser.close();
