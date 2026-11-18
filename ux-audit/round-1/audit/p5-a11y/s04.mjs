import { start, go, P, focusInfo, tabWalk, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const live = () => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => (e.getAttribute("role")||"")+"/"+e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,160)));
await go(page, P + "/pois"); await page.waitForTimeout(1200);
await page.getByRole("button",{name:"New point of interest"}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(600);
console.log("dlg focus", JSON.stringify(await focusInfo(page)));
console.log(await page.locator("[role=dialog]").first().ariaSnapshot());
await s.shot("pois-create__open");
console.log("axe", JSON.stringify(await axe(page,"create-dialog")));
const w = await tabWalk(page, 12); w.forEach(x=>console.log(x.tag,x.type,x.name,x.ring.slice(0,30),x.dialog));
// back to start, submit empty
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("after esc", JSON.stringify(await focusInfo(page)));
await page.keyboard.press("Enter"); await page.waitForTimeout(500);
// submit empty: find submit
await page.locator("[role=dialog]").getByRole("button",{name:/^Create/}).focus().catch(e=>console.log("no create btn"));
console.log("sub", JSON.stringify(await focusInfo(page)));
await page.keyboard.press("Enter"); await page.waitForTimeout(800);
console.log("after empty submit focus", JSON.stringify(await focusInfo(page)), JSON.stringify(await live()));
await s.shot("pois-create__empty-submit");
console.log(await page.locator("[role=dialog]").first().ariaSnapshot());
console.log("axe", JSON.stringify(await axe(page,"create-dialog-error")));
await s.browser.close();
