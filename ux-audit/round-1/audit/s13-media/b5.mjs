import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const s = await start(vp); const { page } = s;
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
await page.getByRole("button",{name:"Upload"}).click(); await page.waitForTimeout(1200);
await s.shot("upload__open");
console.log(await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText));
console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
// tab cycle
const order=[]; for(let i=0;i<8;i++){ await page.keyboard.press("Tab"); order.push(await page.evaluate(()=>{const e=document.activeElement; return e.tagName+":"+(e.getAttribute("aria-label")||e.innerText||"").slice(0,25)})); }
console.log(order.join(" > "));
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("after esc dialog?", await page.locator("[role=dialog]").count(), "focus", await page.evaluate(()=>document.activeElement?.innerText?.slice(0,30)));
await s.browser.close();
