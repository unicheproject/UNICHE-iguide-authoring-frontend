import { start, goEd, P, tall, poi, place, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
page.on("dialog", async d => { await d.accept(); });
await goEd(page, "/pois/"+MINE.poi2);
await page.getByRole("button", { name: /discard/i }).first().click().catch(()=>{});
// Asset picker
await page.getByRole("button", { name: /choose asset/i }).first().click(); await page.waitForTimeout(1500);
await s.shot("asset-picker__open");
const d = page.getByRole("dialog"); console.log("asset dlg:", (await d.innerText()).replace(/\n+/g," | ").slice(0,500));
console.log("focus:", await page.evaluate(()=>document.activeElement.getAttribute("aria-label")||document.activeElement.tagName+":"+document.activeElement.textContent.trim().slice(0,30)));
// choose first asset
const first = d.locator("button,[role=option],li").filter({ hasText: /./ }).nth(2);
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
console.log("focus after Esc:", await page.evaluate(()=>document.activeElement.textContent.trim().slice(0,30)));
// Coordinates: type
await page.locator("#f-lat").fill("37.9715"); await page.locator("#f-lng").fill("23.7257"); await page.waitForTimeout(800);
await page.locator("#f-lat").scrollIntoViewIfNeeded(); await s.shot("placement__typed-coords");
console.log("placement area text:", (await page.locator("section:has(#f-lat)").innerText()).replace(/\n+/g," | ").slice(0,500));
// invalid coords
await page.locator("#f-lat").fill("999"); await page.waitForTimeout(500); await s.shot("placement__invalid-lat");
console.log("invalid lat msg:", (await page.locator("section:has(#f-lat)").innerText()).replace(/\n+/g," | ").slice(0,300));
// add triggers
await page.locator("#f-lat").fill("37.9715");
await page.getByRole("button", { name: /\+ QR code/i }).click(); await page.waitForTimeout(500);
await page.getByRole("button", { name: /\+ Geo-proximity/i }).click(); await page.waitForTimeout(500);
await page.getByRole("button", { name: /\+ Bluetooth beacon/i }).click(); await page.waitForTimeout(500);
const trig = page.locator("section:has(h2:text('How visitors reach it'))"); await trig.scrollIntoViewIfNeeded(); await s.shot("triggers__added-three");
console.log("triggers:", (await trig.innerText()).replace(/\n+/g," | ").slice(0,900));
await tall(s, "poi2-with-triggers-dirty");
await s.browser.close();
