import { start, go, P, focusInfo, tabWalk } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const live = () => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => (e.getAttribute("role")||"")+"/"+e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,100)));
await go(page, P + "/pois"); await page.waitForTimeout(1200);
// skip link
await page.keyboard.press("Tab"); await s.shot("skip__focused");
await page.keyboard.press("Enter"); console.log("after skip", JSON.stringify(await focusInfo(page)), page.url());
const mainInfo = await page.evaluate(()=>({id:document.querySelector("main")?.id, tabindex:document.querySelector("main")?.getAttribute("tabindex"), active: document.activeElement.tagName}));
console.log(JSON.stringify(mainInfo));
// route change by keyboard from nav
await go(page, P + "/pois"); await page.waitForTimeout(1000);
await tabWalk(page, 8); // Points of Interest? index 8 => POI link. we want Routes link = 9
await page.keyboard.press("Tab");
console.log("on", JSON.stringify(await focusInfo(page)));
await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
console.log("after nav Enter:", page.url(), "title:", await page.title(), "focus:", JSON.stringify(await focusInfo(page)), "live:", JSON.stringify(await live()));
await s.shot("route-change__routes");
// Search field focus ring
await go(page, P + "/pois"); await page.waitForTimeout(1200);
await page.getByRole("searchbox").or(page.getByPlaceholder(/search/i)).first().focus().catch(()=>{});
await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
await s.shot("pois__search-focus");
console.log("search", JSON.stringify(await focusInfo(page)));
// Filters popover
await page.getByRole("button",{name:/^Filters/}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
console.log("filters open focus", JSON.stringify(await focusInfo(page)));
await s.shot("pois__filters-open");
console.log(await page.locator("[role=dialog]").first().ariaSnapshot().catch(e=>"no dialog "+e.message));
const w = await tabWalk(page, 14); w.forEach(x=>console.log(x.tag,x.role,x.name,x.ring.slice(0,25),x.dialog));
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("after esc", JSON.stringify(await focusInfo(page)));
await s.browser.close();
