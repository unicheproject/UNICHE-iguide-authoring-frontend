import { start, go, P, focusInfo, tabWalk, tabTo, live, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/preview"); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(3500);
console.log("nav", await page.locator("nav[aria-label=Primary]").ariaSnapshot());
const total = await page.evaluate(()=>{const f=[...document.querySelectorAll("main a[href],main button:not([disabled]),main input,main select,main textarea,main [tabindex]:not([tabindex='-1'])")].filter(e=>e.getClientRects().length); return {all:f.length}});
console.log("focusables in main", JSON.stringify(total));
// language + surface switch by keyboard, live
await tabTo(page, /^Mobile$/); await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
console.log("after mobile: focus", JSON.stringify(await focusInfo(page)), "live", JSON.stringify(await live(page)));
await s.shot("preview__mobile");
await tabTo(page, /Ελληνικά/); await page.keyboard.press("Space"); await page.waitForTimeout(1500);
console.log("after greek: live", JSON.stringify(await live(page)), await page.evaluate(()=>document.documentElement.lang));
console.log("preview region lang attrs", await page.evaluate(()=>[...document.querySelectorAll("[lang]")].map(e=>e.tagName+":"+e.lang).slice(0,5)));
// fire trigger
await tabTo(page, /Choose a trigger/); await page.keyboard.press("ArrowDown"); await page.waitForTimeout(1500);
console.log("trigger live", JSON.stringify(await live(page)));
await s.shot("preview__trigger-fired");
// Into the frame and out: tab until focus inside, then shift-tab out
const idx = await page.evaluate(()=>0);
console.log("axe", JSON.stringify((await axe(page,"preview")).map(v=>v.id+":"+v.impact+":"+v.nodes)));
// count tab stops to end of doc
let n=0, last=""; for(;n<400;n++){ await page.keyboard.press("Tab"); const f=await focusInfo(page); if(f.tag==="BODY"||!f.name&&f.tag==="html"){break;} last=f.name; }
console.log("tab stops from trigger select to end", n, "last", last);
await s.browser.close();
