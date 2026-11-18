import { start, go, P, focusInfo, tabWalk, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const live = () => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => (e.getAttribute("role")||"")+"/"+e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,160)));
await go(page, P + "/pois"); await page.waitForTimeout(1200);
// type search by keyboard
await page.getByRole("button",{name:"New point of interest"}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
await page.keyboard.type("UX-p5-a11y Alpha"); 
await page.keyboard.press("Tab");await page.keyboard.press("Tab"); await page.keyboard.type("P5-001");
await page.keyboard.press("Tab"); 
console.log("slug", await page.evaluate(()=>document.activeElement.value));
await page.keyboard.press("Enter"); await page.waitForTimeout(2000);
console.log("after create", page.url(), JSON.stringify(await focusInfo(page)), JSON.stringify(await live()), await page.title());
await s.shot("poi-editor__after-create");
const url = page.url(); 
console.log(await page.locator("main").ariaSnapshot());
s.save("poi-editor-snapshot.txt", await page.locator("main").ariaSnapshot());
console.log("axe", JSON.stringify((await axe(page,"poi-editor")).map(v=>v.id+":"+v.impact+":"+v.nodes+":"+v.sample[0])));
await s.browser.close();
