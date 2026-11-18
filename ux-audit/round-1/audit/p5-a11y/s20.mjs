import { start, go, P, focusInfo, tabWalk, tabTo, live, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/floor-plans/fef09ea8-f347-4742-8a34-cffc3ee87328"); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2000);
await page.locator("li",{hasText:"UX-p5-a11y Beta"}).getByRole("button",{name:/^Place/}).focus().catch(()=>{});
await page.keyboard.press("Enter"); await page.waitForTimeout(600);
const marker = page.getByRole("button",{name:/UX-p5-a11y Beta: arrow keys/});
await marker.focus(); 
console.log("marker focus ring", JSON.stringify(await focusInfo(page)));
for (const k of ["ArrowRight","ArrowRight","ArrowDown"]) await page.keyboard.press(k);
await page.waitForTimeout(500);
console.log("after arrows live", JSON.stringify(await live(page)), "xy", await page.locator("li input").evaluateAll(i=>i.map(x=>x.value)));
await s.shot("floorplan-editor__marker-focus");
await page.getByRole("textbox",{name:"x",exact:true}).focus(); await page.keyboard.press("Control+a"); await page.keyboard.type("1.7"); await page.keyboard.press("Tab");
console.log("x=1.7 ->", await page.locator("li input").evaluateAll(i=>i.map(x=>x.value+"|"+x.getAttribute("aria-invalid")+"|"+x.getAttribute("min")+"|"+x.type)), JSON.stringify(await live(page)));
await s.shot("floorplan-editor__x-out-of-range");
// Save and 422 not needed. Save legit? Save for cleanup
console.log("inline errors", await page.locator("main").getByText(/between|0 and 1|must/i).allTextContents());
await s.browser.close();
