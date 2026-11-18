import { session, go, P, ids, shot, sleep } from "./h.mjs";
const { browser, page } = await session({ viewport: "1440" });
await go(page, P(`/routes/${ids.routeEmpty}`)); await sleep(3000);
console.log(page.url(), await page.title());
await shot(page, "dbg");
await browser.close();
