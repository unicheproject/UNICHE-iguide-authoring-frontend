import { start, go, P, focusInfo, tabWalk, tabTo, live, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/pois"); await page.waitForTimeout(1500);
const order = async()=> page.locator("tbody tr a").allTextContents();
console.log("filter hint when filtered:");
await page.getByRole("searchbox").focus(); await page.keyboard.type("Beta"); await page.waitForTimeout(1000);
console.log(await page.locator("main").innerText().then(t=>t.split("\n").filter(l=>/sort|order|drag|reorder|filter/i.test(l))));
await page.keyboard.press("Control+a"); await page.keyboard.press("Delete"); await page.waitForTimeout(1000);
await page.getByRole("button",{name:"Move UX-p5-a11y Beta up"}).focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
console.log("after move up: focus", JSON.stringify(await focusInfo(page)), "live", JSON.stringify(await live(page)), (await order()).slice(-3));
await s.shot("pois__after-move-up");
const up = page.getByRole("button",{name:"Move UX-p5-a11y Beta up"});
console.log("rows moved; Beta up btn exists", await up.count());
// move back down
await page.getByRole("button",{name:"Move UX-p5-a11y Beta down"}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
console.log("after move down: focus", JSON.stringify(await focusInfo(page)), (await order()).slice(-3));
// set position?
console.log("set position control:", await page.getByText(/position/i).count(), await page.locator("tbody input").count());
console.log("drag handle", await page.evaluate(()=>{const h=document.querySelector("tbody tr td:first-child [draggable],tbody tr [class*=grip],tbody tr td:first-child span"); return h?h.outerHTML.slice(0,200):"none"}));
await s.browser.close();
