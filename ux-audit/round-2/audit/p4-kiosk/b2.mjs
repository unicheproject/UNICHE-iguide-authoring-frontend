import { open, go, P, POI, shot, settle, targets, report } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "768", touch: true });
const errs=[]; page.on("pageerror", e=>errs.push(e.message));
await page.setViewportSize({ width: 768, height: 600 });
await go(page, `/projects/${P}/pois/${POI}`); await settle(page, 2500);
await shot(page, "poi-editor__draft-top__768x600", false);
// sticky stack
const stick = () => page.evaluate(() => [...document.querySelectorAll("*")].filter(e=>{const p=getComputedStyle(e).position; if(p!=="sticky"&&p!=="fixed")return false; const r=e.getBoundingClientRect(); return r.width>300&&r.height>20;}).map(e=>({tag:e.tagName, cls:(e.className||"").toString().slice(0,40), top:Math.round(e.getBoundingClientRect().top), h:Math.round(e.getBoundingClientRect().height)})));
console.log("sticky at top", JSON.stringify(await stick()));
// focus title and type (keyboard-up approximation: 768x400)
await page.setViewportSize({ width: 768, height: 400 });
const title = page.getByLabel(/^Title/).first(); await title.tap(); await page.keyboard.type(" – typed"); await page.waitForTimeout(500);
await shot(page, "poi-editor__typing__768x400", false);
console.log("sticky 400", JSON.stringify(await stick()));
const tb = await title.boundingBox(); console.log("title visible box", JSON.stringify(tb));
// scroll to summary and see where focus field lands
const sum = page.getByLabel(/^Summary/).first(); await sum.tap(); await page.waitForTimeout(500);
const sb = await sum.boundingBox(); console.log("summary box in 400px viewport", JSON.stringify(sb));
await shot(page, "poi-editor__summary-focus__768x400", false);
await page.setViewportSize({ width: 768, height: 600 });
// section nav?
console.log("section links", await page.getByRole("link", { name: /Placement|How visitors|Media|Details/ }).evaluateAll(a=>a.map(x=>x.textContent.trim()+" "+Math.round(x.getBoundingClientRect().height))));
// triggers: add QR / geo / beacon
const sec = page.locator("section", { hasText: "How visitors reach it" }).first();
await sec.scrollIntoViewIfNeeded();
for (const n of ["QR code", "Geo-proximity", "Bluetooth beacon"]) { await sec.getByRole("button", { name: n, exact: false }).first().tap().catch(e=>console.log("add fail", n)); await page.waitForTimeout(500); }
await sec.scrollIntoViewIfNeeded(); await shot(page, "poi-triggers__three-added__768x600", false);
await sec.screenshot({ path: "ux-audit/round-2/audit/p4-kiosk/shots/poi-triggers__card-three__768.png" });
console.log("trigger text:", (await sec.innerText()).replace(/\n/g," | ").slice(0,1500));
const t = await page.evaluate(() => { const s=[...document.querySelectorAll("section")].find(x=>/How visitors reach it/.test(x.textContent)); const out=[]; for (const e of s.querySelectorAll("button,a,input,select,label")) { const r=e.getBoundingClientRect(); if(r.width&&r.height&&(r.height<44)) out.push((e.getAttribute("aria-label")||e.textContent||e.id||e.type).trim().slice(0,28)+" "+Math.round(r.width)+"x"+Math.round(r.height)); } return out; });
console.log("small in triggers", t);
console.log("errs", errs);
await browser.close();
