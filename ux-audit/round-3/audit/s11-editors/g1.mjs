import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("guides", IDS.guide)); await settle(page,1500);
console.log(await txt(page));
await shot(page,"guide__fresh__1440");
console.log(await page.evaluate(()=>[...document.querySelectorAll("main button")].map(b=>(b.getAttribute("aria-label")||b.textContent.trim()).slice(0,40)).join(" | ")));
await browser.close();
