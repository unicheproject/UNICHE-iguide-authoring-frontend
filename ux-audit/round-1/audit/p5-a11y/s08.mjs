import { start, go, P, focusInfo, tabWalk, tabTo, live, openPoi } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await openPoi(page, s);
console.log(JSON.stringify(await tabTo(page, /^Title$/)));
await page.keyboard.type(" edited");
await s.shot("poi-editor__title-focus-dirty");
const sv = page.getByRole("button",{name:/^Save/});
console.log("save btn", await sv.count(), await sv.first().isDisabled(), await sv.first().textContent());
await page.keyboard.press("Tab"); 
console.log("tab order after edit: next", JSON.stringify(await focusInfo(page)));
// Shift+Tab backwards to see where Save sits
const back = []; for (let i=0;i<30;i++){ await page.keyboard.press("Shift+Tab"); const f=await focusInfo(page); back.push(f.name); if(/Save/i.test(f.name)){ console.log("Save reached after shift-tabs", i+1); break;} }
console.log(back.join(" < "));
await page.keyboard.press("Enter"); await page.waitForTimeout(400);
console.log("live during", JSON.stringify(await live(page)));
await page.waitForTimeout(1500);
console.log("after save focus", JSON.stringify(await focusInfo(page)), JSON.stringify(await live(page)));
console.log("toasts", await page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert],[data-sonner-toast],[class*=toast]")].map(e=>e.outerHTML.slice(0,300))));
await s.shot("poi-editor__after-save");
await s.browser.close();
