import { start, go, P, focusInfo, tabWalk, tabTo, live, axe, seed } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/pois"); await page.waitForTimeout(1500);
// project switcher
await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
console.log("switcher focus", JSON.stringify(await focusInfo(page)));
console.log("btn attrs", await page.evaluate(()=>{const b=document.activeElement; return {haspopup:b.getAttribute("aria-haspopup"), expanded:b.getAttribute("aria-expanded"), label:b.getAttribute("aria-label")}}));
await page.keyboard.press("Enter"); await page.waitForTimeout(800);
console.log("switcher open focus", JSON.stringify(await focusInfo(page)));
console.log(await page.locator("[role=dialog],[role=listbox],[role=menu]").first().ariaSnapshot().then(t=>t.split("\n").slice(0,40).join("\n")).catch(()=>"no popup role"));
await s.shot("switcher__open");
console.log("axe", JSON.stringify((await axe(page,"switcher")).map(v=>v.id+":"+v.impact+":"+v.nodes)));
const w = await tabWalk(page, 8); w.forEach((x,i)=>console.log(i+1,x.tag,x.role,x.name,"|",(x.ring||"").slice(0,22),x.dialog?"in":"OUT"));
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("after esc", JSON.stringify(await focusInfo(page)));
// project switch to Empty by keyboard
await page.keyboard.press("Enter"); await page.waitForTimeout(800);
const emptyOpt = page.getByText("UX Audit – Empty").first();
console.log("empty option", await emptyOpt.count());
await tabTo(page, /UX Audit – Empty/, 30);
await page.keyboard.press("Enter"); await page.waitForTimeout(2500);
console.log("after switch", page.url().slice(-40), "focus", JSON.stringify(await focusInfo(page)), "live", JSON.stringify(await live(page)), "title", await page.title());
await s.shot("switcher__after-switch-empty");
console.log("h1", await page.locator("h1").allTextContents());
await s.browser.close();
