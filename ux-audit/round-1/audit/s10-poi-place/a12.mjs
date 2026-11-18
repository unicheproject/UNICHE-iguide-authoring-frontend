import { start, goEd, P, tall, poi, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await goEd(page, "/pois/"+MINE.poi1);
await tall(s, "poi1-draft-indoor");
await s.shot("poi1-draft__top");
// scroll to bottom: is Save visible?
await page.locator("main").evaluate(m=>m.scrollTo(0, m.scrollHeight)); await page.waitForTimeout(300);
await s.shot("poi1-draft__scrolled-bottom");
const vis = await page.getByRole("button", { name: /^save$/i }).evaluate(b=>{const r=b.getBoundingClientRect(); return {top:r.top, bottom:r.bottom}});
console.log("Save button rect at bottom scroll", vis);
// type something to make dirty, scroll to bottom
await page.locator("main").evaluate(m=>m.scrollTo(0,0));
await page.getByLabel("Title", {exact:false}).first().fill("UX-s10-poi-place Odeon Mosaic Floor Ψηφιδωτό (edited)");
await page.waitForTimeout(500); await s.shot("poi1-draft__dirty-top");
// Tab order from title
const stops=[]; await page.getByLabel("Title",{exact:false}).first().focus();
for (let i=0;i<45;i++){ await page.keyboard.press("Tab"); stops.push(await page.evaluate(()=>{const e=document.activeElement; return (e.getAttribute("aria-label")||e.innerText||e.id||e.tagName).toString().trim().slice(0,30).replace(/\n/g," ")+" ["+e.tagName+"]"})); }
console.log(stops.join("\n"));
await s.browser.close();
