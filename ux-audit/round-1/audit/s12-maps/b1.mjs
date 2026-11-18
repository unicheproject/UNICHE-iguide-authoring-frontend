import { start, go, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/floor-plans"); await page.waitForTimeout(1500);
await page.getByRole("button", { name: "New floor plan" }).first().click(); await page.waitForTimeout(700);
await s.shot("newfp__open");
console.log("focus:", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
// submit empty
await page.getByRole("button",{name:"Create floor plan"}).click(); await page.waitForTimeout(600);
await s.shot("newfp__empty-submit");
console.log(await page.locator("[role=dialog] [role=alert], [role=dialog] .text-destructive").allInnerTexts());
console.log("focus after invalid submit:", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
await page.getByRole("button",{name:"Choose image"}).click(); await page.waitForTimeout(1500);
await s.shot("newfp__picker");
console.log((await page.locator("[role=dialog]").last().innerText()).slice(0,900).replace(/\n/g," | "));
await s.browser.close();
