import { fresh, uiSignIn, shot, text, CMS } from "./lib.mjs";
const { browser, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
await page.goto(CMS + "/projects/new?resume=cddb627d-1ec0-4f83-9dca-91da3df58183"); await page.waitForTimeout(3000);
await page.getByRole("button", { name: /^Continue/ }).click(); await page.waitForTimeout(800);
await page.getByRole("button", { name: /^Continue/ }).click(); await page.waitForTimeout(800);
await shot(page, "create__step4-review", "1440");
const t0 = Date.now();
await page.getByRole("button", { name: /Initialize Project/ }).click();
for (let i=0;i<8;i++){ await page.waitForTimeout(500); if(i<3) await shot(page, `create__initializing-t${i}`, "1440", false); }
await page.waitForLoadState("networkidle").catch(()=>{}); await page.waitForTimeout(2500);
console.log("landed", page.url(), await page.title(), Date.now()-t0, "ms");
await shot(page, "dashboard__new-project-after-initialize", "1440");
console.log((await text(page)).slice(0,1500));
await browser.close();
