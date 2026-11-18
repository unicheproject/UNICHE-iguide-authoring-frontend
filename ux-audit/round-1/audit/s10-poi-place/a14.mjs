import { start, goEd, P, tall, poi, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
page.on("dialog", async d => { await d.accept(); });
await goEd(page, "/pois/"+MINE.poi2);
await page.getByLabel("Title",{exact:false}).first().fill("UX-s10-poi-place Garden Bench v3 unsaved");
await page.getByLabel("Summary",{exact:false}).first().fill("Unsaved summary text");
await page.waitForTimeout(1500);
await page.goto(page.url()); await page.locator("main h1").first().waitFor().catch(()=>{}); await page.waitForTimeout(1500);
await s.shot("restore-draft-banner__after-reload");
console.log("banner:", (await page.locator("[role=status]").allInnerTexts()).join(" | ").slice(0,400));
console.log("title now:", await page.getByLabel("Title",{exact:false}).first().inputValue());
// Preview popover, Esc after focus moved to inside; and click outside
await page.getByRole("button", { name: /restore/i }).first().click().catch(()=>{}); await page.waitForTimeout(500);
console.log("title after restore:", await page.getByLabel("Title",{exact:false}).first().inputValue());
await s.shot("restore-draft__after-restore");
await page.getByRole("button", { name: /preview in app/i }).click(); await page.waitForTimeout(800);
await page.getByRole("dialog").getByText("WEB", {exact:false}).first().click(); await page.waitForTimeout(600);
console.log("focus after switching to WEB:", await page.evaluate(()=>document.activeElement.innerText));
await page.keyboard.press("Escape"); await page.waitForTimeout(400); console.log("closed after Esc (focus on chip)?", await page.getByRole("dialog").count()===0);
await page.getByRole("button", { name: /preview in app/i }).click(); await page.waitForTimeout(500);
await page.getByRole("dialog").getByText("KIOSK", {exact:false}).first().click(); await page.waitForTimeout(600); await s.shot("preview-popover__kiosk");
// click page behind
await page.mouse.click(300, 700); await page.waitForTimeout(400); console.log("closed after outside click?", await page.getByRole("dialog").count()===0);
// Tab order inside: open and tab
await page.getByRole("button", { name: /preview in app/i }).click(); await page.waitForTimeout(500);
const st=[]; for (let i=0;i<8;i++){ await page.keyboard.press("Tab"); st.push(await page.evaluate(()=>{const e=document.activeElement; return (e.getAttribute("aria-label")||e.innerText||e.tagName).toString().trim().slice(0,25).replace(/\n/g," ")})); } console.log("tab in preview:", st.join(" > "));
await s.browser.close();
