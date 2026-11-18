import { start, go, P, focusInfo, tabWalk, tabTo, live, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/preview"); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(3500);
await s.shot("preview__default");
console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").slice(0,70).join("\n")));
console.log("frames", await page.evaluate(()=>[...document.querySelectorAll("iframe,[role=region][aria-label],[role=group]")].map(f=>f.tagName+"|"+(f.title||"")+"|"+(f.getAttribute("aria-label")||"")+"|"+f.getAttribute("src")?.slice(0,60))));
await page.evaluate(()=>{document.activeElement.blur(); window.scrollTo(0,0)});
// start after nav: go to main via skip link
await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
const w = await tabWalk(page, 45); w.forEach((x,i)=>console.log(i+1,x.tag,x.role,x.name,"|",(x.ring||"").slice(0,26),x.w+"x"+x.h, x.vis?"":"OFF"));
await s.browser.close();
