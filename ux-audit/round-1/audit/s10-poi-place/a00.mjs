import { start, go, P, poi } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + `/pois/${poi("frieze").id}`); await page.waitForTimeout(2500);
console.log(page.url()); console.log((await page.locator("body").innerText()).slice(0,300));
await s.shot("dbg"); await s.browser.close();
