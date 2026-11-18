import { start, goEd, P, tall, poi, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
page.on("dialog", async d => { console.log("NATIVE DIALOG", d.type(), d.message()); await d.dismiss(); });
const focusDesc = () => page.evaluate(()=>{const e=document.activeElement; return (e.getAttribute("aria-label")||e.innerText||e.id||e.tagName).toString().trim().slice(0,40).replace(/\n/g," ")});
await goEd(page, "/pois/"+MINE.poi2);
// 1. Preview popover
await page.getByRole("button", { name: /preview in app/i }).click(); await page.waitForTimeout(1200);
await s.shot("preview-popover__open");
const dlg = page.getByRole("dialog"); console.log("preview dialog:", await dlg.count(), await dlg.first().getAttribute("aria-label").catch(()=>null), await dlg.first().getAttribute("aria-modal").catch(()=>null));
const box = await dlg.first().boundingBox(); console.log("box", box);
console.log("focus in preview:", await focusDesc());
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("preview after Esc:", await page.getByRole("dialog").count(), "focus:", await focusDesc());
// 2. unsaved then in-app nav
await page.getByLabel("Title",{exact:false}).first().fill("UX-s10-poi-place Garden Bench v2");
await page.waitForTimeout(400);
await page.getByRole("link", { name: /^places$/i }).first().click().catch(e=>console.log("click err", e.message.slice(0,80))); await page.waitForTimeout(1200);
console.log("after in-app nav url:", page.url()); console.log("dialogs:", await page.getByRole("dialog").count());
await s.shot("unsaved-guard__after-nav-click");
console.log((await page.locator("body").innerText()).slice(0,0));
// 3. browser back
await page.goBack().catch(()=>{}); await page.waitForTimeout(1200); console.log("after back:", page.url(), "dialogs:", await page.getByRole("dialog").count());
// 4. reload with unsaved
await goEd(page, "/pois/"+MINE.poi2);
await page.getByLabel("Title",{exact:false}).first().fill("UX-s10-poi-place Garden Bench v3 unsaved");
await page.waitForTimeout(1500);
await page.reload(); await page.locator("main h1").first().waitFor().catch(()=>{}); await page.waitForTimeout(1500);
await s.shot("restore-draft-banner__after-reload");
console.log("banner:", (await page.locator("[role=status]").allInnerTexts()).join(" | ").slice(0,400));
await s.browser.close();
