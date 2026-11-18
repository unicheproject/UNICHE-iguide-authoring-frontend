import { start, goEd, P, poi, place, MINE } from "./common.mjs";
const s = await start("1440"); const { page } = s;
page.on("dialog", async d => { await d.accept(); });
await goEd(page, "/places/"+MINE.place);
await page.getByRole("button", { name: /^new map$/i }).click().catch(async()=>{ await page.getByText("New map",{exact:true}).click(); }); await page.waitForTimeout(1200);
await s.shot("place__new-map-dialog"); console.log("dlg:", (await page.getByRole("dialog").innerText().catch(()=>"NONE")).replace(/\n+/g," | ").slice(0,500));
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
// Sub-place switch
await page.getByRole("button", { name: /sub-place/i }).click(); await page.waitForTimeout(500);
await s.shot("place__level-subplace-no-parent");
console.log("after Sub-place:", (await page.locator("section[aria-labelledby=place-setup-heading]").innerText()).replace(/\n+/g," | ").slice(0,400));
await page.getByRole("button", { name: /^save$/i }).click().catch(()=>{}); await page.waitForTimeout(1200);
await s.shot("place__save-no-parent");
console.log("summary:", (await page.locator("[data-error-summary]").innerText().catch(()=>"none")).replace(/\n+/g," | "));
// Type select options
console.log("type opts:", await page.locator("select").last().locator("option").allInnerTexts());
await s.browser.close();
