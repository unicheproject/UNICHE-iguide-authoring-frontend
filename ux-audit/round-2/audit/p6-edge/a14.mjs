import { open, go, P, ids, shot, settle, alerts, focused, main, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const dlg = () => page.locator("[role=dialog],[role=alertdialog]");
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 800);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 800);
await page.locator("#f-summary").fill("guard test edit 3"); await page.waitForTimeout(700);
// project switch
await page.getByRole("button", { name: /Switch project/ }).click(); await page.waitForTimeout(900);
const items = await page.locator("[role=dialog] a, [role=dialog] button").evaluateAll(es => es.map(e => (e.textContent||"").trim().replace(/\s+/g," ").slice(0,60)));
console.log("items", items.slice(0, 14));
const target = page.locator("[role=dialog] a, [role=dialog] button").filter({ hasText: /Empty D|Empty B|UX Audit – Empty/ }).first();
console.log("target", await target.count() ? await target.innerText() : "none");
if (await target.count()) {
  await target.click(); await page.waitForTimeout(1200);
  console.log("SWITCH guard dialogs:", await dlg().count(), (await dlg().allInnerTexts()).map(t => t.replace(/\n+/g," | ").slice(0,250)));
  await shot(page, "poi-editor__leave-guard-project-switch");
  console.log("popover still open (search box visible):", await page.getByPlaceholder(/search/i).first().isVisible().catch(()=>false), "dialogs", await dlg().count());
  console.log("url", page.url().slice(-70));
}
// beforeunload
let bu = null; page.on("dialog", async d => { bu = d.type() + ": " + d.message(); await d.dismiss(); });
await page.keyboard.press("Escape").catch(()=>{});
await page.evaluate(() => 0);
await page.close({ runBeforeUnload: true });
await page.waitForTimeout(800);
console.log("beforeunload dialog:", bu, "page closed:", page.isClosed());
await browser.close();
