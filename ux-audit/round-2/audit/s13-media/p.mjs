import { open, go, t, shot } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1280" });
await go(page, `/`); await page.waitForTimeout(3500);
console.log((await t(page,"body")).replace(/\n+/g," | ").slice(0,900));
await browser.close();
