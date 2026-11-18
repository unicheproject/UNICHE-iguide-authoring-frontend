import { session, go, P, ids, sleep } from "./h.mjs";
const { browser, page } = await session({ viewport: "1440" });
await go(page, P(`/pois/${ids.poi}`)); await page.waitForSelector("#f-title");
await page.locator("[data-preview-action]").first().click(); await sleep(800);
const q = () => page.evaluate(() => ({ var: getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h"), sp: getComputedStyle(document.documentElement).scrollPaddingTop, top: document.querySelector("#editor-preview > *").getBoundingClientRect().top, h: document.querySelector("#editor-preview > *").getBoundingClientRect().height, mh: document.querySelector("#editor-preview > *").style.maxHeight }));
console.log(await q());
await page.locator("#editor-preview button", { hasText: /^\s*Expand/ }).first().click(); await sleep(1000);
console.log(await q());
await browser.close();
