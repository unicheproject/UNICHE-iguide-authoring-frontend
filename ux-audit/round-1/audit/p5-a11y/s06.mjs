import { start, go, P, focusInfo, tabWalk, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const live = () => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => (e.getAttribute("role")||"")+"/"+e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,160)));
await go(page, P + "/pois"); await page.waitForTimeout(1200);
await page.getByRole("searchbox").focus(); await page.keyboard.type("UX-p5-a11y"); await page.waitForTimeout(1200);
console.log("rows", await page.locator("tbody tr").count(), "live", JSON.stringify(await live()));
await s.shot("pois__search-typed");
// duplicate create
await page.getByRole("button",{name:"New point of interest"}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
await page.keyboard.type("UX-p5-a11y Alpha");
await page.keyboard.press("Enter"); await page.waitForTimeout(2000);
console.log("dup:", page.url(), JSON.stringify(await focusInfo(page)), JSON.stringify(await live()));
await s.shot("pois-create__duplicate");
console.log(await page.locator("[role=dialog]").first().ariaSnapshot().catch(()=> "no dialog"));
await s.browser.close();
