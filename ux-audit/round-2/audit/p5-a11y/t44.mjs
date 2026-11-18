import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/pois/35d91cba-d64a-43ce-9773-1e472226d028"), 1800);
await L.watchLive(page);
await page.getByRole("textbox", { name: "Description" }).focus(); await k.type("Unsaved leave-guard text");
const a = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Routes", exact: true });
await a.focus(); await k.press("Enter"); await page.waitForTimeout(900);
L.log("t44", "leave guard: url", page.url().split("/").pop(), "focus", await L.focus(page), "dialog", await page.locator("[role=dialog],[role=alertdialog]").evaluateAll((d) => d.map((x) => x.getAttribute("role") + ":" + x.innerText.slice(0, 300).replace(/\n+/g, " | "))));
await L.shot(page, "poi-editor__leave-guard__1440");
L.log("t44", "tabs", await L.tabs(page, 4));
await k.press("Escape"); await page.waitForTimeout(500);
L.log("t44", "Esc: focus", await L.focus(page), "still on editor", page.url().includes("pois/35d9"));
// leave and come back: restore banner
await a.focus(); await k.press("Enter"); await page.waitForTimeout(700);
const leave = page.getByRole("button", { name: /leave|discard|go away/i }).first();
L.log("t44", "guard buttons", await page.locator("[role=dialog] button, [role=alertdialog] button").allTextContents());
await page.locator("[role=dialog] button, [role=alertdialog] button").filter({ hasText: /Leave/i }).first().click().catch(() => {});
await page.waitForTimeout(1500);
await L.nav(page, L.P("/pois/35d91cba-d64a-43ce-9773-1e472226d028"), 1800);
L.log("t44", "reopen: restore banner", await page.getByText(/restore|unsaved draft/i).allTextContents(), "focus", await L.focus(page));
await L.shot(page, "poi-editor__restore-banner__1440");
const rb = page.getByRole("button", { name: /^Restore/ }).first();
if (await rb.count()) { await rb.focus(); await k.press("Enter"); await page.waitForTimeout(600); L.log("t44", "after Restore: focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-2)); }
const db = page.getByRole("button", { name: /^Discard/ }).first();
if (await db.count()) { await db.focus(); await k.press("Enter"); await page.waitForTimeout(600); L.log("t44", "after Discard: focus", await L.focus(page), "dialogs", await page.locator("[role=dialog],[role=alertdialog]").count()); }
await browser.close();
