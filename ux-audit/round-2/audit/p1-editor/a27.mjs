import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const desc=()=>page.evaluate(()=>{const a=document.activeElement; return a.tagName+":"+(a.getAttribute("aria-label")||a.textContent.trim().slice(0,30)||a.id)});
await go(page, `/projects/${P}/pois`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
console.log("start focus", await desc());
// Tab from the start to Routes nav
await page.evaluate(()=>{document.body.setAttribute("tabindex","-1"); document.body.focus()});
let n=0, seq=[];
for(;n<40;n++){ await page.keyboard.press("Tab"); const d=await desc(); seq.push(d); if(/^A:Routes/.test(d)) break; }
console.log("tabs to Routes link:", n+1, seq.join(" > "));
await page.keyboard.press("Enter"); await page.waitForURL(/routes/); await settle(page,1500);
console.log("after Enter title:", await page.title(), "focus:", await desc());
// Tab count from landing to first row control
seq=[]; for(let i=0;i<14;i++){ await page.keyboard.press("Tab"); seq.push(await desc()); }
console.log("first 14 tabs on routes list:", seq.join(" > "));
// Skip link
await go(page, `/projects/${P}/pois`); await settle(page,1200);
await page.evaluate(()=>{document.body.focus()}); await page.keyboard.press("Tab"); console.log("first tab:", await desc());
await page.keyboard.press("Enter"); await settle(page,300); console.log("after skip:", await desc());
// tabs through list to row 3
seq=[]; for(let i=0;i<12;i++){ await page.keyboard.press("Tab"); seq.push(await desc()); }
console.log("12 tabs after skip:", seq.join(" > "));
await shot(page,"pois-list__keyboard-focus__1440");
// Alt shortcuts
await page.keyboard.press("g"); await page.keyboard.press("r"); await settle(page,500); console.log("after g r:", page.url().split("/").pop());
await browser.close();
