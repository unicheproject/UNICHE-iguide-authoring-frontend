import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const dlg = () => page.locator("[role=dialog],[role=alertdialog]").first();
await go(page, `${PP}/pois/${I.poiC}`); await settle(page, 1000);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/pois/${I.poiC}`); await settle(page, 1000);
const deact = page.getByRole("button", { name: /^Deactivate/ }).first();
console.log("Deactivate disabled?", await deact.isDisabled(), "aria-disabled", await deact.getAttribute("aria-disabled"), "desc", await deact.getAttribute("aria-describedby"), "title", await deact.getAttribute("title"));
const used = await page.getByText(/Used in|Used by/).first().locator("xpath=ancestor::*[self::section or self::div][1]").innerText().catch(() => "?");
console.log("USED:", used.replace(/\n+/g, " | ").slice(0, 500));
console.log("STATUS CARD:", (await page.locator("main").innerText()).replace(/\n+/g," | ").match(/Status.{0,400}/)?.[0]);
await shot(page, "poi-editor__referenced-active", "1440", true);
await deact.click(); await page.waitForTimeout(1500);
console.log("DEACT dialog:", (await dlg().innerText().catch(() => "(none)")).replace(/\n+/g, " | ").slice(0, 600));
await shot(page, "poi-deactivate__referenced-dialog");
const c = dlg().getByRole("button", { name: /deactivate/i }).last();
if (await c.count()) { await c.click(); await page.waitForTimeout(2500); console.log("after confirm:", (await dlg().innerText().catch(() => "(none)")).replace(/\n+/g, " | ").slice(0, 600), "| alerts", JSON.stringify(await alerts(page)).slice(0,400)); await shot(page, "poi-deactivate__refused"); }
// More actions -> Archive
await page.keyboard.press("Escape");
await page.getByRole("button", { name: "More actions" }).click(); await page.waitForTimeout(500);
console.log("MORE menu:", await page.locator("[role=menu]").innerText().catch(()=> "?"));
const arch = page.getByRole("menuitem", { name: /archive/i });
console.log("archive item disabled", await arch.getAttribute("aria-disabled"), await arch.getAttribute("title"), "desc", await arch.getAttribute("aria-describedby"));
await shot(page, "poi-editor__more-menu-referenced");
await arch.click().catch(()=>{}); await page.waitForTimeout(1500);
console.log("ARCHIVE dialog:", (await dlg().innerText().catch(() => "(none)")).replace(/\n+/g, " | ").slice(0, 700));
await shot(page, "poi-archive__referenced-dialog");
await browser.close();
