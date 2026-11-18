import { open, go, rec, P, shot, ready, axe, tall } from "./h.mjs";
const S="ux-audit/round-2/audit/s11-editors/shots/";
const { browser, page } = await open("curator", { viewport: "1440" });
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean));
await go(page, `/projects/${P}/routes/${rec.route}`); await ready(page,1200);
await page.getByRole("button",{name:"Add stops"}).click(); await page.waitForTimeout(600);
const dlg=page.getByRole("dialog");
// filters
await dlg.locator("#pick-search").fill("Parthenon"); await page.waitForTimeout(500);
console.log("parthenon rows", await dlg.getByRole("button").count());
await dlg.locator("#pick-search").fill("109"); await page.waitForTimeout(500);
console.log("code search:", (await dlg.innerText()).slice(0,200).replace(/\n+/g," / "));
await dlg.locator("#pick-search").fill("zzzzqq"); await page.waitForTimeout(500);
await page.screenshot({path:S+"route-picker__no-results__1440.png"});
console.log("noresult:", (await dlg.innerText()).replace(/\n+/g," / ").slice(0,300));
await dlg.locator("#pick-search").fill("");
const selects = dlg.locator("select"); console.log("selects", await selects.count());
await selects.nth(1).selectOption({index:2}); await page.waitForTimeout(500);
await page.screenshot({path:S+"route-picker__place-filter__1440.png"});
console.log("place filtered:", (await dlg.innerText()).replace(/\n+/g," / ").slice(0,300));
const rows=dlg.locator("button").filter({hasText:"Active"});
const n=await rows.count(); for (let i=0;i<Math.min(3,n);i++) await rows.nth(i).click();
await page.keyboard.press("Escape"); await page.waitForTimeout(1500);
await page.getByRole("heading",{name:/^Stops/}).scrollIntoViewIfNeeded();
await page.screenshot({path:S+"route-map__numbered-stops__1440.png"});
await tall(page,"route-map__tall__1440");
console.log("live",await live());
// Leave with unsaved changes
await page.getByRole("link",{name:"Guides"}).first().click(); await page.waitForTimeout(1200);
console.log("url after leave", page.url(), "dialogs", await page.getByRole("dialog").count());
if (await page.getByRole("dialog").count()) { console.log((await page.getByRole("dialog").innerText()).replace(/\n+/g," / ")); await page.screenshot({path:S+"route-editor__leave-guard__1440.png"}); }
await browser.close();
