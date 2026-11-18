import { open, go, shot, wait, url, ids, active, txt } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("pois", ids.poiTrig)); await wait(page, 1800);
const card = page.locator("section:has(h2:has-text('How visitors reach it'))");
for (const n of ["QR code","Geo-proximity","Beacon"]) { await card.getByRole("button",{name:new RegExp(n)}).first().click(); await wait(page,400); }
await shot(page,"poi-trig__three-added__1440", true);
console.log(await card.innerText().then(t=>t.replace(/\n+/g," | ")));
console.log("inputs:", await card.locator("input,select,textarea").evaluateAll(es=>es.map(e=>`${e.tagName}#${e.id}[${e.getAttribute("aria-label")||""}] ${e.type}`)));
await browser.close();
