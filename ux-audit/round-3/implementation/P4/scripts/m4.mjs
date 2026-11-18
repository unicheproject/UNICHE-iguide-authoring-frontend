import { open, go } from "../../../../tools/session.mjs";
const PID="6958c18f-60d2-4140-a524-5a43f8a2f6b5", PLACE="93abfa5d-4113-48d6-b718-1f58dd246b79";
const out="C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/ux-audit/round-3/implementation/P4/after/";
const { browser, page } = await open("admin",{viewport:"1440"});
await go(page,`/projects/${PID}/places/${PLACE}`);
await page.waitForSelector("text=Place setup");
const hdr=async()=>page.evaluate(()=>({unsaved:/Unsaved changes/.test(document.body.innerText), notice:document.querySelector("[data-link-notice]")?.textContent?.replace(/\s+/g," ").trim()}));
console.log("start",await hdr());
const sel=page.locator("#f-link");
if (await sel.inputValue()) { await sel.selectOption({label:"No map"}); await page.waitForTimeout(1500); }
await sel.selectOption({label:"UX-R3-P4 Map"});
await page.waitForTimeout(1500);
console.log("linked",await hdr());
await page.locator("[data-link-notice]").scrollIntoViewIfNeeded();
await page.screenshot({path:out+"place-linked__1440.png"});
await page.locator("[data-link-notice]").getByRole("button",{name:/Undo/}).click();
await page.waitForTimeout(1500);
console.log("undone",await hdr(), await sel.inputValue());
await page.screenshot({path:out+"place-undone__1440.png"});
// with dirty form
await page.getByLabel(/^summary$/i).fill("x"+Date.now());
await sel.selectOption({label:"UX-R3-P4 Map"}); await page.waitForTimeout(1200);
console.log("dirty+linked",await hdr());
await sel.selectOption({label:"No map"}); await page.waitForTimeout(1200);
// tab stops from Save to end of Placement
await browser.close();
