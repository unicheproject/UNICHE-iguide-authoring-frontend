import { open, go } from "../tools/session.mjs";
const { browser, page } = await open("admin");
await go(page, "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois");
await page.waitForTimeout(3000);
const b = await page.locator('button[aria-label^="Actions for"]').first().boundingBox();
console.log("kebab", JSON.stringify(b));
await browser.close();
