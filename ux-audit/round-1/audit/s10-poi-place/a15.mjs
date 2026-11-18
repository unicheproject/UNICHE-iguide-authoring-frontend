import { start, goEd, P, tall, poi, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
page.on("dialog", async d => { await d.accept(); });
const toasts = async () => console.log("TOAST/ALERT:", (await page.locator("[role=alert],[role=status],[aria-live]").allInnerTexts()).filter(Boolean).join(" || ").replace(/\n+/g," ").slice(0,400));
await goEd(page, "/pois/"+MINE.poi1);
// discard leftover
await page.getByRole("button", { name: /^activate$/i }).click(); await page.waitForTimeout(1800);
await s.shot("poi1__activated-top"); await toasts();
console.log("readiness:", (await page.locator("#attention-heading ~ ul").innerText().catch(()=>"n/a")).replace(/\n+/g," | "));
// edit -> Save draft
await page.getByLabel("Summary",{exact:false}).first().fill("A short summary for the working-copy walk."); await page.waitForTimeout(500);
await s.shot("poi1__active-dirty-top");
console.log("buttons:", await page.getByRole("button").allInnerTexts().then(a=>a.filter(x=>/save|apply|discard/i.test(x))));
await page.getByRole("button", { name: /save draft/i }).click(); await page.waitForTimeout(1800);
await s.shot("poi1__after-save-draft"); await toasts();
await page.getByRole("button", { name: /apply changes/i }).click(); await page.waitForTimeout(1000);
const d = page.getByRole("dialog"); console.log("apply dialog:", (await d.innerText().catch(()=>"NONE")).replace(/\n+/g," | "));
await s.shot("poi1__apply-confirm");
await page.keyboard.press("Escape");
await page.getByRole("button", { name: /discard changes/i }).click(); await page.waitForTimeout(800);
console.log("discard dialog:", (await d.innerText().catch(()=>"NONE")).replace(/\n+/g," | "));
await s.shot("poi1__discard-confirm");
await page.keyboard.press("Escape");
await s.browser.close();
