import * as H from "./h.mjs";
const log = H.LOG("p0");
const { browser, page } = await H.session();
await H.go(page, H.P("/pois/" + H.ids.poi)); await H.sleep(2500);
await H.shot(page, "poi-editor__base__1440");
log(await page.evaluate(() => [...document.querySelectorAll("button,a[href],input,textarea,select")].filter(e=>e.getBoundingClientRect().width>0).map(e => e.tagName.toLowerCase() + ":" + (e.getAttribute("aria-label") || e.innerText || e.placeholder || e.name||e.id || "").trim().slice(0, 40).replace(/\n/g," ")).join(" | ")));
await browser.close();
