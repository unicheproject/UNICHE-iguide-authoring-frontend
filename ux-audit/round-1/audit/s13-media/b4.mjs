import { start, go, P } from "./common.mjs";
for (const vp of ["1280","1024","768","zoom200"]) {
const s = await start(vp); const { page } = s;
await go(page, `${P}/media`); await page.waitForSelector("main ul li a"); await page.waitForTimeout(800);
await s.shot("library__grid");
const ov = await page.evaluate(()=>({sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth, ms:document.querySelector("main").scrollWidth, mc:document.querySelector("main").clientWidth}));
console.log(vp, "grid", JSON.stringify(ov));
await page.getByRole("button",{name:"List"}).click(); await page.waitForTimeout(600);
await s.shot("library__list");
console.log(vp,"list", JSON.stringify(await page.evaluate(()=>({ms:document.querySelector("main").scrollWidth, mc:document.querySelector("main").clientWidth, tw:document.querySelector("table").getBoundingClientRect().width}))));
await page.getByRole("button",{name:"Grid"}).click();
await s.browser.close();
}
