import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const dir = new URL("./files/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const s = await start(vp); const { page } = s;
await go(page, `${P}/pois`); await page.waitForSelector("tbody tr a, tbody tr");
await page.locator("tbody tr a").first().click(); await page.waitForSelector("h1"); await page.waitForTimeout(2500);
const btns = await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>b.innerText.trim()+"|"+(b.getAttribute("aria-label")||"")).filter(t=>/Add|Choose|Replace/i.test(t)));
console.log(btns);
const b = page.getByRole("button",{name:/^Add image/i}).first();
await b.scrollIntoViewIfNeeded(); await b.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
await s.shot("picker__open");
console.log("dialog text:", await page.evaluate(()=>document.querySelector("[role=dialog]")?.innerText.replace(/\n+/g," | ").slice(0,1200)));
console.log("focus in dialog:", await page.evaluate(()=>!!document.activeElement.closest("[role=dialog]")+" "+document.activeElement.tagName+" "+(document.activeElement.getAttribute("aria-label")||document.activeElement.innerText||"").slice(0,40)));
// tab through
const order=[]; for(let i=0;i<10;i++){ await page.keyboard.press("Tab"); order.push(await page.evaluate(()=>{const e=document.activeElement; return (e.closest("[role=dialog]")?"D":"OUT")+":"+e.tagName+":"+(e.getAttribute("aria-label")||e.innerText||e.placeholder||"").replace(/\n/g," ").slice(0,28)})); }
console.log(order.join(" > "));
// search
const q = page.getByRole("searchbox").or(page.locator("[role=dialog] input[type=search]")).first();
await q.fill("frieze"); await page.waitForTimeout(400); await s.shot("picker__search");
console.log("tiles", await page.locator("[role=dialog] [role=option], [role=dialog] li button, [role=dialog] ul li").count());
await q.fill("zzzz"); await page.waitForTimeout(300); await s.shot("picker__empty");
await q.fill("");
// select first tile by keyboard
const tile = page.locator("[role=dialog] ul li button").first();
console.log("tile attrs", await tile.evaluate(e=>e.outerHTML.slice(0,250)));
await tile.focus(); await page.keyboard.press("Space"); await page.waitForTimeout(400);
await s.shot("picker__selected");
console.log("footer:", await page.evaluate(()=>document.querySelector("[role=dialog]").innerText.split("\n").slice(-8).join(" | ")));
// escape
await page.keyboard.press("Escape"); await page.waitForTimeout(600);
console.log("after esc dialogs", await page.locator("[role=dialog]").count(), "focus:", await page.evaluate(()=>(document.activeElement.getAttribute("aria-label")||document.activeElement.innerText||"").slice(0,40)));
await s.browser.close();
