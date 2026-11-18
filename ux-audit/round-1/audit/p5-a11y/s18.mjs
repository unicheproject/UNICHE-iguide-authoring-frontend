import { start, go, P, focusInfo, tabWalk, tabTo, live, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/floor-plans"); await page.waitForTimeout(2000);
await page.evaluate(()=>{document.activeElement.blur()});
await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
await tabTo(page, /^New floor plan/); await page.keyboard.press("Enter"); await page.waitForTimeout(1000);
await page.keyboard.press("Enter"); await page.waitForTimeout(1200); // Choose image
console.log("picker", JSON.stringify(await focusInfo(page)));
await tabTo(page, /^UX-p5-a11y-upload/); await page.keyboard.press("Enter");
await tabTo(page, /Use this|^Use/); await page.keyboard.press("Enter"); await page.waitForTimeout(800);
console.log("back in dialog", JSON.stringify(await focusInfo(page)));
await tabTo(page, /^Name$/); await page.keyboard.type("UX-p5-a11y Plan");
await tabTo(page, /^Create floor plan/); await page.keyboard.press("Enter"); await page.waitForTimeout(2500);
console.log("after create", page.url(), JSON.stringify(await focusInfo(page)), JSON.stringify(await live(page)));
await s.shot("floorplan-editor__top");
console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").slice(0,70).join("\n")));
console.log("axe", JSON.stringify((await axe(page,"fp-editor")).map(v=>v.id+":"+v.impact+":"+v.nodes+":"+v.sample[0])));
await s.browser.close();
