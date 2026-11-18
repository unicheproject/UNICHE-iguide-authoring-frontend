import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("events", IDS.event)); await settle(page,1500);
console.log(await txt(page));
await shot(page,"event__fresh__1440");
await page.screenshot({path:"ux-audit/round-3/audit/s11-editors/shots/event__fresh-full__1440.png", fullPage:true});
console.log(await page.evaluate(()=>[...document.querySelectorAll("main button, main input, main select")].map(b=>b.tagName+"#"+b.id+":"+(b.getAttribute("aria-label")||b.textContent.trim()).slice(0,30)).join(" | ")));
await browser.close();
