import { start, go, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/maps"); await page.waitForTimeout(1500);
await s.shot("maps-list__default");
const rows = await page.locator("main li").allInnerTexts(); console.log(rows);
await go(page, P + "/floor-plans"); await page.waitForTimeout(1500);
await s.shot("floorplans-list__default");
console.log(await page.locator("main li").allInnerTexts());
// tab semantics
console.log(await page.locator('[role=tablist], nav[aria-label]').evaluateAll(e=>e.map(x=>x.outerHTML.slice(0,400))));
await s.browser.close();
