import { open, go, P, ids, shot, settle, alerts, focused, main, AP } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const dlg = () => page.locator("[role=dialog],[role=alertdialog]");
const dtext = async () => (await dlg().count()) ? `${await dlg().count()} dialog(s): ` + (await dlg().first().innerText()).replace(/\n+/g, " | ").slice(0, 300) : "(none)";
await go(page, `${PP}/pois?q=UX-R2-p6`); await settle(page, 1500);
await page.getByRole("link", { name: /UX-R2-p6 POI Alpha/ }).first().click(); await page.waitForTimeout(2000);
await page.evaluate(() => localStorage.clear());
await page.locator("#f-summary").fill("guard test edit 2"); await page.waitForTimeout(700);
console.log("start url", page.url().slice(-60));
// Back via SPA history
await page.goBack(); await page.waitForTimeout(1200);
console.log("2 BACK:", await dtext(), "| url now", page.url().slice(-60));
await shot(page, "poi-editor__leave-guard-back");
console.log("  buttons:", await dlg().getByRole("button").allInnerTexts());
await page.keyboard.press("Escape"); await page.waitForTimeout(600);
console.log("  after Esc url", page.url().slice(-60), "| editor still shown:", await page.locator("#f-summary").count(), "| focus", await focused(page));
// Forward
// project switch
await page.getByRole("button", { name: /Switch project/ }).click(); await page.waitForTimeout(900);
await shot(page, "poi-editor__project-switcher-open");
console.log("  switcher:", (await page.locator("body").innerText()).replace(/\n+/g," | ").match(/Switch project.{0,500}/)?.[0]);
console.log("  popup roles", await page.evaluate(() => [...document.querySelectorAll("[role=dialog],[role=listbox],[role=menu],[data-radix-popper-content-wrapper],[data-reka-popper-content-wrapper]")].map(e=>e.getAttribute("role")+":"+e.textContent.trim().slice(0,100))));
await browser.close();
