import { open, go, P, shot, settle, IDS, url, txt } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("routes", IDS.route)); await settle(page,1500);
console.log(await txt(page));
await shot(page,"route__fresh__1440");
await page.screenshot({path:"ux-audit/round-3/audit/s11-editors/shots/route__fresh-full__1440.png", fullPage:true});
console.log(await page.evaluate(()=>[...document.querySelectorAll("button")].map(b=>(b.getAttribute("aria-label")||b.textContent.trim()).slice(0,40)).join(" | ")));
await browser.close();
