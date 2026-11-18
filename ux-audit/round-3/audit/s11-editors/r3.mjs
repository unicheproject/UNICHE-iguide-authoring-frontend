import { open, go, P, shot, settle, IDS, url, txt } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("routes", IDS.route)); await settle(page,1500);
console.log(await page.evaluate(()=>document.querySelector("#stops, [id*=stops]")?.id));
// add 3 more stops (alpha already? unsaved state discarded on reload -> maybe restore prompt)
console.log(await txt(page,"body").then(t=>t.slice(0,300)));
await page.getByRole("button",{name:"Add stops"}).click(); await settle(page,600);
const d = page.getByRole("dialog");
const s = d.locator("#pick-search"); await s.fill("UX-R3-s11");
await settle(page,500);
for (let i=0;i<4;i++){ await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await settle(page,200);}
await d.getByRole("button",{name:/^Done/}).click(); await settle(page,600);
console.log("focus after Done", await page.evaluate(()=>document.activeElement.outerHTML.slice(0,200)));
const stops = page.locator("section,div").filter({has: page.getByRole("heading",{name:/^Stops/})}).last();
await page.getByRole("heading",{name:/^Stops/}).scrollIntoViewIfNeeded();
await settle(page,300);
await shot(page,"route__4stops__1440");
await page.screenshot({path:"ux-audit/round-3/audit/s11-editors/shots/route__4stops-full__1440.png", fullPage:true});
const html = await page.evaluate(()=>{const h=[...document.querySelectorAll("h2,h3")].find(h=>/^Stops/.test(h.textContent)); const sec=h.closest("section")||h.parentElement.parentElement; return sec.outerHTML.slice(0,6000)});
console.log(html);
await browser.close();
