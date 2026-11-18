import { start, go, P, focusInfo, tabWalk, tabTo, live, openPoi, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await openPoi(page, s, "edited");
await tabTo(page, /^Choose asset$/); await page.keyboard.press("Enter"); await page.waitForTimeout(1200);
await tabTo(page, /^tiny-thumbnail/);
await page.keyboard.press("Enter"); await page.waitForTimeout(500);
console.log("sel", await page.evaluate(()=>document.activeElement.outerHTML.slice(0,300)));
console.log("dialog buttons", await page.locator("[role=dialog] button").evaluateAll(b=>b.filter(x=>/Use|Cancel|Close/.test(x.textContent)).map(x=>x.textContent.trim()+(x.disabled?"(disabled)":""))));
await s.shot("asset-picker__selected");
await tabTo(page, /Use this image/);
console.log("use focus", JSON.stringify(await focusInfo(page)));
await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
console.log("after attach focus", JSON.stringify(await focusInfo(page)), "live", JSON.stringify(await live(page)));
await s.shot("poi-editor__image-attached");
console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").filter(l=>/Primary|image|Remove|Change|Alt|alt|tiny/i.test(l)).slice(0,14).join("\n")));
// attachment image alt
console.log(await page.evaluate(()=>[...document.querySelectorAll("main img")].map(i=>({alt:i.alt,src:i.src.slice(-40)})).slice(0,5)));
console.log("axe", JSON.stringify((await axe(page,"image-attached")).map(v=>v.id+":"+v.impact+":"+v.nodes)));
await s.browser.close();
