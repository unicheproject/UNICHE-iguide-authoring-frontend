import { session, go, P, ids, sleep } from "./h.mjs";
const { browser, page } = await session({ viewport: "1440" });
await go(page, P(`/pois/${ids.poi}`)); await page.waitForSelector("#status-card-heading"); await sleep(800);
console.log(await page.evaluate(() => ({ filters: document.querySelectorAll("input[type=search]").length, selects: [...document.querySelectorAll("select")].map((s) => s.options.length), stack: getComputedStyle(document.documentElement).getPropertyValue("--sticky-stack-h"), app: Math.round(document.querySelector("header").getBoundingClientRect().bottom) })));
await browser.close();
