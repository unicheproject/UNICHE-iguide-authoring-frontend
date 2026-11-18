import { open, go, P, shot, settle } from "./h.mjs";
const vp = "1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/media?type=AUDIO&alt=1`); await settle(page);
console.log(await page.evaluate(()=>({url:location.search, main: document.querySelector("main")?.innerText.slice(0,900)})));
await shot(page, `lib__audio-noalt-empty__${vp}`);
await go(page, `/projects/${P}/media?type=AUDIO`); await settle(page);
console.log(await page.evaluate(()=>({url:location.search, count: document.querySelector("[data-media-count]")?.textContent.trim(), n: document.querySelectorAll("ul[aria-label='Media files'] > li").length, txt: [...document.querySelectorAll("ul[aria-label='Media files'] > li")].slice(0,3).map(l=>l.innerText.replace(/\n+/g," | "))})));
await shot(page, `lib__audio__${vp}`);
await go(page, `/projects/${P}/media?q=zzzz`); await settle(page);
console.log(await page.evaluate(()=>({main: document.querySelector("main")?.innerText.slice(0,500)})));
await shot(page, `lib__search-none__${vp}`);
// special/greek/rtl search
await go(page, `/projects/${P}/media?status=ARCHIVED`); await settle(page);
console.log(await page.evaluate(()=>({url:location.search,count: document.querySelector("[data-media-count]")?.textContent.trim(), seg:[...document.querySelectorAll("[role=radiogroup] *, [role=tablist] *")].map(e=>e.textContent.trim()).filter(Boolean).slice(0,10)})));
await browser.close();
