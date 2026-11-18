import * as H from "./h.mjs";
const log = H.LOG("e32");
const { browser, page } = await H.session();
await H.go(page, H.P("/pois/" + H.ids.poi2)); await H.sleep(2000);
log("small buttons", await page.evaluate(() => [...document.querySelectorAll("button")].filter(b=>{const r=b.getBoundingClientRect();return r.width>0 && (r.width<40||r.height<40)}).map(b=>(b.getAttribute("aria-label")||b.textContent.trim()).slice(0,40)+" "+Math.round(b.getBoundingClientRect().width)+"x"+Math.round(b.getBoundingClientRect().height))));
log("page height", await page.evaluate(()=>document.documentElement.scrollHeight));
await browser.close();
