import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${ID}`);
await page.getByRole("heading", { level: 1 }).first().waitFor(); await settle(page,1000);
// image via keyboard-ish: open, pick tile, use
await page.getByRole("button",{name:/add primary image/i}).click(); await settle(page,1200);
const d=page.getByRole("dialog");
await d.getByRole("button",{name:/^List$/}).click(); await settle(page,400);
await shot(page,"asset-picker__image-list__1440");
console.log((await d.innerText()).slice(0,700));
await d.getByText("klepsydra").first().click(); await settle(page,300);
await shot(page,"asset-picker__image-selected__1440");
console.log("selected footer:", (await d.innerText()).slice(-300));
await d.getByRole("button",{name:/use this/i}).click(); await settle(page,800);
// map click
const map=page.locator(".leaflet-container").first(); await map.scrollIntoViewIfNeeded();
const bb=await map.boundingBox(); await page.mouse.click(bb.x+bb.width*0.5,bb.y+bb.height*0.5); await settle(page,500);
console.log("lat/lng after map click:", await page.locator("#f-lat").inputValue(), await page.locator("#f-lng").inputValue());
await shot(page,"poi-editor__map-placed__1440");
// triggers
await page.getByRole("button",{name:/^QR code/}).first().scrollIntoViewIfNeeded();
const sec=page.locator("section,div").filter({hasText:/How visitors reach it/}).last();
await page.getByRole("button",{name:/QR code/}).first().click(); await settle(page,600);
await page.getByRole("button",{name:/Geo-proximity/}).first().click(); await settle(page,600);
await shot(page,"poi-editor__triggers-added__1440");
console.log("TRIGGERS:", await page.evaluate(()=>{const h=[...document.querySelectorAll("h2,h3")].find(e=>/How visitors reach/.test(e.textContent)); return h?.closest("section,div")?.parentElement?.innerText.slice(0,1500)}));
await browser.close();
