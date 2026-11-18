import { open, go, P, ids, shot, settle, alerts, focused, main } from "./lib.mjs";
const I = ids();
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${I.poiA}`); await settle(page);
await shot(page, "poi-editor__draft__baseline");
console.log(await page.evaluate(() => [...document.querySelectorAll("button,a[href],input,textarea,select")].filter(e=>e.offsetParent).map(e => `${e.tagName}|${e.type||""}|${(e.getAttribute("aria-label")||e.textContent||e.name||e.id||"").trim().replace(/\s+/g," ").slice(0,40)}`).join("\n")));
await browser.close();
