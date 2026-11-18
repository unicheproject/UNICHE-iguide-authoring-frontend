import * as H from "./h.mjs";
const log = H.LOG("e17");
const { browser, page } = await H.session();
await H.go(page, H.P("/pois/" + H.ids.poi2));
for (const t of [300, 1500, 4000]) { await H.sleep(t === 300 ? 300 : 1500); log("t", t, await page.evaluate(() => { const l = [...document.querySelectorAll("label")].find(x=>/^Latitude/.test(x.textContent)); const f=document.querySelector('input[placeholder^="Filter places"]'); return { lat: l && Math.round(l.getBoundingClientRect().y), filter: !!f, filterVisible: f && f.getBoundingClientRect().height > 0 }; })); }
await H.shot(page, "poi-editor__place-filter__1440");
await browser.close();
