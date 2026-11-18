import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const s = await start(vp); const { page } = s;
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
await page.fill("#media-search","UX-s13-media portrait"); await page.waitForTimeout(400);
await page.locator("main ul li a").first().click();
await page.waitForSelector("h1"); await page.waitForTimeout(2000);
// activate with no alt
await page.getByRole("button",{name:"Activate"}).click(); await page.waitForTimeout(1500);
await s.shot("editor__activate-422");
console.log("after activate:", await page.evaluate(()=>[...document.querySelectorAll("[role=alert],[role=status],[aria-live]")].map(e=>e.textContent.trim().slice(0,300)).join("\n---\n")));
console.log("dialog?", await page.locator("[role=dialog],[role=alertdialog]").count(), "focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,100)));
await page.evaluate(()=>{document.querySelector("main").scrollTop=0});
await s.shot("editor__activate-422-scrolltop");
const sc = await page.evaluate(()=>document.querySelector("main").scrollTop);
console.log("scrollTop", sc);
// Scroll to alt field
await page.getByLabel(/Alternative text/i).first().scrollIntoViewIfNeeded();
await page.getByLabel(/Alternative text/i).first().focus();
await s.shot("editor__alt-focused-image-gone");
console.log("img visible while on alt:", await page.evaluate(()=>{const i=document.querySelector("main img"); const r=i.getBoundingClientRect(); return r.bottom>0 && r.top<innerHeight}));
await page.keyboard.type("A purple tinted test image of columns, used only in the UX audit.");
await page.waitForTimeout(500);
await s.shot("editor__alt-typed");
await page.getByRole("tab",{name:/ΕΛΛΗΝΙΚΆ/}).click(); await page.waitForTimeout(500);
await s.shot("editor__greek-tab");
console.log(await page.evaluate(()=>document.querySelector("main").innerText.slice(300,1400)));
await s.browser.close();
