import { fresh, uiSignIn, shot, text, CMS } from "./lib.mjs";
const { browser, context, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440");
await shot(page, "landing__after-signin", "1440");
console.log(page.url(), "title:", await page.title());
console.log(await text(page));
console.log("STORAGE", JSON.stringify(await page.evaluate(() => ({ls: Object.keys(localStorage), ss: Object.keys(sessionStorage)}))));
await browser.close();
