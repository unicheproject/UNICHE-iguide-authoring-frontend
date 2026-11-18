import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois`);
await page.getByRole("button", { name: /new point of interest/i }).click();
await settle(page);
await shot(page, "poi-create-dialog__empty__1440");
const d = page.getByRole("dialog");
console.log(await d.innerText());
console.log("focused:", await page.evaluate(() => document.activeElement?.outerHTML.slice(0,150)));
// invalid submit
await d.getByRole("button", { name: /create|save/i }).last().click();
await settle(page);
await shot(page, "poi-create-dialog__invalid__1440");
console.log("AFTER INVALID:", await d.innerText());
await page.keyboard.press("Escape"); await settle(page,400);
console.log("dialog count after esc", await page.getByRole("dialog").count(), "focus", await page.evaluate(() => document.activeElement?.textContent?.slice(0,40)));
await browser.close();
