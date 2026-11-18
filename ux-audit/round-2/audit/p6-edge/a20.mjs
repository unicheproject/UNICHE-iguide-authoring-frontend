import { open, go, P, ids, shot, settle, alerts, focused, main } from "./lib.mjs";
const I = ids(); const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const dlg = () => page.locator("[role=dialog],[role=alertdialog]").first();
await go(page, `${PP}/events/${I.event}`); await settle(page, 1200);
await page.evaluate(() => localStorage.clear());
await go(page, `${PP}/events/${I.event}`); await settle(page, 1200);
const rm = page.getByRole("button", { name: /^Remove (date|occurrence)/i });
console.log("remove buttons", await page.getByRole("button", { name: /remove/i }).evaluateAll(es => es.map(e => e.getAttribute("aria-label") || e.textContent.trim())));
await shot(page, "event-editor__draft-dates", "1440", true);
await page.getByRole("button", { name: /remove/i }).first().click(); await page.waitForTimeout(700);
console.log("after remove: alerts", JSON.stringify(await alerts(page)).slice(0, 500), "| focus", await focused(page));
console.log("undo bar:", await page.evaluate(() => [...document.querySelectorAll("button")].filter(b => /undo/i.test(b.textContent)).map(b => b.closest("[role]")?.textContent.trim().replace(/\s+/g," ").slice(0,150) || b.parentElement.textContent.trim().slice(0,150))));
await shot(page, "event-editor__removed-undo-bar");
await page.getByRole("button", { name: /undo/i }).first().click(); await page.waitForTimeout(600);
console.log("after Undo: dates", await page.getByRole("button", { name: /remove/i }).count(), "| focus", await focused(page), "alerts", JSON.stringify(await alerts(page)).slice(0,300));
// remove again, wait, navigate away
await page.getByRole("button", { name: /remove/i }).first().click(); await page.waitForTimeout(500);
console.log("bar present before nav:", await page.getByRole("button", { name: /undo/i }).count());
await page.waitForTimeout(7000);
console.log("bar after 7s:", await page.getByRole("button", { name: /undo/i }).count());
await page.getByRole("link", { name: "Routes", exact: true }).first().click(); await page.waitForTimeout(800);
console.log("guard:", (await dlg().innerText().catch(() => "(none)")).replace(/\n+/g," | ").slice(0,300));
await page.getByRole("button", { name: /Leave without saving/ }).click(); await page.waitForTimeout(1500);
await go(page, `${PP}/events/${I.event}`); await settle(page, 1200);
console.log("reopen: banner", (await main(page, 4000)).match(/Unsaved changes from[^|]*\|[^|]*/)?.[0], "| remove buttons", await page.getByRole("button", { name: /remove/i }).count());
const restore = page.getByRole("button", { name: /^Restore$/ });
if (await restore.count()) { await restore.click(); await page.waitForTimeout(800); console.log("after Restore: remove buttons", await page.getByRole("button", { name: /remove/i }).count(), "alerts", JSON.stringify(await alerts(page)).slice(0,250), "| undo available", await page.getByRole("button", { name: /undo/i }).count()); await shot(page, "event-editor__restored-draft"); }
await browser.close();
