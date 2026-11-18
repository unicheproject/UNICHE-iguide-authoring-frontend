import { start, go, P, focusInfo, tabWalk, tabTo, live, axe, seed, openPoi } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/pois/22ba8181-7028-4c14-9cb2-ee091893190b"); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(4000);
console.log("map focusables", await page.evaluate(()=>{const m=document.querySelector("[aria-label^='Site map']"); const f=[...m.querySelectorAll("path,circle,[tabindex],a,button")]; const foc=f.filter(e=>e.tabIndex>=0); return {total:f.length, tabbable:foc.length, tags:[...new Set(foc.map(e=>e.tagName+":"+(e.getAttribute("role")||"")+":"+(e.getAttribute("aria-label")||"unnamed")+":"+e.getAttribute("tabindex")))].slice(0,6)}}));
await tabTo(page, /Site map/); const w = await tabWalk(page, 6); console.log(w.map(x=>x.tag+":"+x.name+":"+x.w).join(" > "));
// toast timing
await page.getByRole("textbox",{name:"Title"}).focus(); await page.keyboard.press("End"); await page.keyboard.type("!");
await page.getByRole("button",{name:/^Save/}).focus(); await page.keyboard.press("Enter");
const t0 = Date.now(); let gone=false; for(let i=0;i<40;i++){ await page.waitForTimeout(500); if(!(await page.getByText(/Draft saved/).count())){ gone = (Date.now()-t0); break; } }
console.log("toast visible ms", gone);
// navigation h1 count
await go(page, P + "/navigation"); await page.waitForTimeout(3000);
console.log("nav page h1s", await page.locator("h1").allTextContents());
// guide heading-level buttons
await go(page, P + `/guides/${seed.guides[0].id}`); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2500);
console.log("heading lvl btn", await page.evaluate(()=>[...document.querySelectorAll("[aria-label^='Level ']")].slice(0,3).map(b=>b.outerHTML.slice(0,200))));
console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").filter(l=>/Move|position|Block|toolbar|Bold|format/i.test(l)).slice(0,16).join("\n")));
await s.browser.close();
