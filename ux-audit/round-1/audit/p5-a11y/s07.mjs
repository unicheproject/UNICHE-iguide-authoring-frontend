import { start, go, P, focusInfo, tabWalk, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const live = () => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => (e.getAttribute("role")||"")+"/"+e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,160)));
await go(page, P + "/pois"); await page.waitForTimeout(1200);
await page.getByRole("searchbox").focus(); await page.keyboard.type("UX-p5-a11y"); await page.waitForTimeout(1200);
await page.getByRole("link",{name:/UX-p5-a11y Alpha/}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(2000);
console.log("editor", page.url(), JSON.stringify(await focusInfo(page)), await page.title(), JSON.stringify(await live()));
await s.shot("poi-editor__top");
// tab walk from start
await page.evaluate(()=>{document.activeElement.blur(); window.scrollTo(0,0)});
await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); 
const w = await tabWalk(page, 120);
// drop nav items
w.forEach((x,i)=>console.log(i+1,x.tag,x.type,x.name,"|",x.ring.slice(0,26),x.w+"x"+x.h));
s.save("tab-poi-editor.json", w);
await s.browser.close();
