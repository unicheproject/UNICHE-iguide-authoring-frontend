import { start, go, P, focusInfo, tabWalk, tabTo, live, openPoi, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await openPoi(page, s, "edited");
console.log(await page.evaluate(()=>{const p=[...document.querySelectorAll("path")].filter(p=>p.getAttribute("tabindex")!==null); return {n:p.length, sample:p.slice(0,2).map(x=>x.outerHTML.slice(0,250)), named: p.filter(x=>x.getAttribute("aria-label")||x.getAttribute("role")).length}}));
// Preview in app
await tabTo(page, /Preview in app/);
await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
console.log("preview open focus", JSON.stringify(await focusInfo(page)));
console.log(await page.locator("[role=dialog]").first().ariaSnapshot().then(t=>t.split("\n").slice(0,40).join("\n")).catch(()=>"no dialog"));
console.log("frames", await page.evaluate(()=>[...document.querySelectorAll("iframe")].map(f=>({title:f.title,lbl:f.getAttribute("aria-label"),src:f.src.slice(0,80)}))));
await s.shot("poi-preview-panel__open");
console.log("axe", JSON.stringify((await axe(page,"preview-panel")).map(v=>v.id+":"+v.impact+":"+v.nodes+":"+v.sample[0])));
const w = await tabWalk(page, 24); w.forEach((x,i)=>console.log(i+1,x.tag,x.name,"|",x.ring.slice(0,22),x.dialog?"in-dialog":"OUTSIDE", x.w+"x"+x.h));
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("after esc", JSON.stringify(await focusInfo(page)));
await s.browser.close();
