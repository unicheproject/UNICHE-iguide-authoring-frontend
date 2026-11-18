import { open, go, P, POI, shot, settle, targets, report } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1024", touch: true });
const errs=[]; page.on("pageerror", e=>errs.push(e.message));
await go(page, `/projects/${P}/pois/${POI}`); await settle(page, 2500);
const place = page.locator("section", { hasText: "Placement" }).first();
await place.getByLabel(/Latitude/).fill("37.9715"); await place.getByLabel(/Longitude/).fill("23.7257");
const sec = page.locator("section", { hasText: "How visitors reach it" }).first(); await sec.scrollIntoViewIfNeeded();
for (const n of ["QR code", "Bluetooth beacon", "Geo-proximity"]) { await sec.getByRole("button", { name: n }).last().tap(); await page.waitForTimeout(400); }
await sec.getByLabel("UUID").fill("e2c56db5-dffb-48d2-b060-d0f5a71096e0");
await sec.getByLabel("Major").fill("1"); await sec.getByLabel("Minor").fill("7");
await sec.getByLabel("Latitude").fill("37.9715"); await sec.getByLabel("Longitude").fill("23.7257"); await sec.getByLabel(/Radius/).fill("40");
await page.getByRole("button", { name: "Save", exact: true }).tap(); await page.waitForTimeout(3500);
console.log("toasts/status:", await page.locator("[role=status],[role=alert]").allTextContents());
await shot(page, "poi-editor__after-save-triggers__1024", false);
const sec2 = page.locator("section", { hasText: "How visitors reach it" }).first(); await sec2.scrollIntoViewIfNeeded();
console.log("saved QR:", (await sec2.locator("code, .font-mono").allTextContents()).slice(0,4));
await shot(page, "poi-triggers__saved-qr__1024", false);
console.log("links", await sec2.locator("a").evaluateAll(a=>a.map(x=>x.textContent.trim().slice(0,30)+" -> "+x.getAttribute("href")?.slice(0,100)+" "+Math.round(x.getBoundingClientRect().height))));
// Test in preview (QR) by tap
const tip = sec2.getByRole("link", { name: /Test in preview/ }).first();
await tip.tap(); await page.waitForTimeout(3500);
console.log("after Test in preview:", page.url());
console.log("preview state:", await page.evaluate(()=>({tabs:[...document.querySelectorAll("[role=tab][aria-selected=true]")].map(t=>t.textContent.trim()), chip:[...document.querySelectorAll("*")].filter(e=>/^Fired:/.test(e.textContent.trim())&&e.children.length<3).map(e=>e.textContent.trim().slice(0,80))[0]})));
await shot(page, "preview__from-test-in-preview-qr__1024", false);
// beacon test in preview
await go(page, `/projects/${P}/pois/${POI}`); await settle(page, 2500);
const s3 = page.locator("section", { hasText: "How visitors reach it" }).first(); await s3.scrollIntoViewIfNeeded();
const links = await s3.getByRole("link", { name: /Test in preview/ }).all(); console.log("test links", links.length);
await links[1].tap(); await page.waitForTimeout(3500);
console.log("after beacon test:", page.url()); 
console.log("preview state:", await page.evaluate(()=>({tabs:[...document.querySelectorAll("[role=tab][aria-selected=true]")].map(t=>t.textContent.trim()), txt:[...document.querySelectorAll("main *")].filter(e=>/Fired|beacon/i.test(e.textContent)&&e.children.length===0).map(e=>e.textContent.trim().slice(0,100)).slice(0,4)})));
await shot(page, "preview__from-test-in-preview-beacon__1024", false);
console.log("errs", errs);
await browser.close();
