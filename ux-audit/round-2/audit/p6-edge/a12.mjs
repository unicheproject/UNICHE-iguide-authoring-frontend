import { open, go, P, ids, shot, settle, alerts, focused, main, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const dlg = () => page.locator("[role=dialog],[role=alertdialog]");
const dtext = async () => (await dlg().count()) ? `${await dlg().count()} dialog(s): ` + (await dlg().first().innerText()).replace(/\n+/g, " | ") : "(none)";
await go(page, `${PP}/pois`); await settle(page, 500);
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 700);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 700);
await page.locator("#f-summary").fill("guard test edit");
await page.waitForTimeout(600);
const u0 = page.url();
// 1. link click
await page.getByRole("link", { name: "Routes", exact: true }).first().click(); await page.waitForTimeout(700);
console.log("1 LINK:", await dtext(), "| url same:", page.url() === u0, "| focus", await focused(page));
await shot(page, "poi-editor__leave-guard-link");
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("  Esc ->", await dtext(), "url", page.url().slice(-40), "focus", await focused(page), "summary kept:", await page.locator("#f-summary").inputValue());
// 2. browser Back
await page.goBack(); await page.waitForTimeout(900);
console.log("2 BACK:", await dtext(), "| url now", page.url().slice(-50));
await shot(page, "poi-editor__leave-guard-back");
// choose stay
const stay = dlg().getByRole("button").first();
console.log("  buttons:", await dlg().getByRole("button").allInnerTexts());
// 3. project switch
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("  after Esc url", page.url().slice(-50));
await page.getByRole("button", { name: /Switch project/ }).click(); await page.waitForTimeout(800);
await shot(page, "poi-editor__project-switcher-open");
const other = page.getByRole("dialog").locator("button,a,[role=option]").filter({ hasText: /UX Audit/ }).filter({ hasNotText: /Populated/ }).first();
console.log("  switcher items", await page.locator("[role=dialog] [role=option], [role=listbox] [role=option], [data-project-id]").count());
if (await other.count()) { await other.click(); await page.waitForTimeout(900); console.log("3 SWITCH:", await dtext(), "| popover still open:", await page.getByRole("searchbox").count()); await shot(page, "poi-editor__leave-guard-switch"); }
else console.log("3 no other project item found:", await page.evaluate(() => document.body.innerText.slice(0, 200)));
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
// 4. beforeunload on reload
let bu = null; page.on("dialog", async d => { bu = d.type() + ": " + d.message(); await d.dismiss(); });
await page.evaluate(() => { document.activeElement?.blur?.(); });
await page.reload().catch(() => {}); await page.waitForTimeout(1500);
console.log("4 RELOAD beforeunload dialog:", bu, "| still same page:", page.url().slice(-40));
// 5. leave via guard "Leave" then draft state
await page.getByRole("link", { name: "Routes", exact: true }).first().click(); await page.waitForTimeout(700);
console.log("5 buttons:", await dlg().getByRole("button").allInnerTexts());
await dlg().getByRole("button", { name: /leave|discard/i }).first().click(); await page.waitForTimeout(1500);
console.log("  after leave url", page.url().slice(-30));
await go(page, `${PP}/pois/${I.poiA}`); await settle(page, 800);
console.log("  reopen: ", (await main(page, 3000)).match(/Unsaved changes from[^|]*\|[^|]*\|[^|]*\|[^|]*/)?.[0], "| summary:", await page.locator("#f-summary").inputValue());
await shot(page, "poi-editor__reopen-after-leave");
await browser.close();
