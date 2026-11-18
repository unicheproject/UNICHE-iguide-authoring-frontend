import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${ID}`);
await page.getByRole("heading", { level: 1 }).first().waitFor(); await settle(page,1000);
await page.getByRole("button",{name:/choose audio narration/i}).first().click(); await settle(page,1200);
const d=page.getByRole("dialog");
await d.getByText("ambient-agora").first().click(); await settle(page,300);
await shot(page,"asset-picker__audio-selected__1440");
console.log("footer:", await d.locator("div").filter({hasText:/selected/}).last().innerText().catch(()=>"?"));
await d.getByRole("button",{name:/use this file/i}).click(); await settle(page,800);
console.log("dialog open?", await page.getByRole("dialog").count(), "focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,140)));
console.log("live:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean)));
await shot(page,"poi-editor__audio-attached__1440");
// image
await page.getByRole("button",{name:/add primary image/i}).click(); await settle(page,1500);
await shot(page,"asset-picker__image__1440");
console.log("IMG PICKER:", (await page.getByRole("dialog").innerText()).slice(0,900));
await browser.close();
