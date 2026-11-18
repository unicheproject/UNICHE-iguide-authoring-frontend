import { start, go, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, `${P}/media`); await page.waitForTimeout(6000);
console.log(page.url()); console.log((await page.evaluate(()=>document.body.innerText)).slice(0,400));
await s.browser.close();
