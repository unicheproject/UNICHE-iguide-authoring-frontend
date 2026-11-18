import { open, go, shot, POP, focusDesc } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
const myrow = async (k, nm) => { await go(page, `/projects/${POP}/${k}?q=${encodeURIComponent("UX-R2-s9 " + nm)}`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900); return page.locator("tbody tr").first(); };
const menu = async (row, name) => { await row.locator("button[aria-label^='Actions for']").click(); const items = await page.getByRole("menuitem").allTextContents(); await page.getByRole("menuitem", { name, exact: true }).click(); await page.waitForTimeout(700); return items; };
// POI: deactivate
let row = await myrow("pois", "POI");
console.log("POI menu:", await menu(row, "Deactivate"));
let dlg = page.getByRole("dialog");
console.log("DEACTIVATE dialog:", (await dlg.innerText()).replace(/\s+/g, " "), "| focus", await focusDesc(page));
await shot(page, "pois-list__deactivate-confirm", "1440");
await dlg.getByRole("button", { name: /^Deactivate/ }).click(); await page.waitForTimeout(1800);
console.log(" after: dialogs", await page.getByRole("dialog").count(), "toasts", await page.locator("[role=status],[role=alert]").allTextContents(), "focus", await focusDesc(page), "row status:", (await page.locator("tbody tr").first().innerText()).replace(/\s+/g, " ").slice(0, 120));
// POI: archive
row = page.locator("tbody tr").first();
console.log("POI archive menu:", await menu(row, "Archive"));
dlg = page.getByRole("dialog");
console.log("ARCHIVE dialog:", (await dlg.innerText()).replace(/\s+/g, " "), "| focus", await focusDesc(page));
await shot(page, "pois-list__archive-confirm", "1440");
await dlg.getByRole("button", { name: /^Archive/ }).click(); await page.waitForTimeout(1800);
console.log(" after archive: dialogs", await page.getByRole("dialog").count(), "toasts", await page.locator("[role=status],[role=alert]").allTextContents(), "focus", await focusDesc(page), "rows", await page.locator("tbody tr").count(), "| main:", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(-260));
await shot(page, "pois-list__after-archive", "1440");
// archived segment
await go(page, `/projects/${POP}/pois?q=${encodeURIComponent("UX-R2-s9 POI")}&status=ARCHIVED`); await page.waitForTimeout(900);
row = page.locator("tbody tr").first();
await row.locator("button[aria-label^='Actions for']").click(); console.log("ARCHIVED row menu:", await page.getByRole("menuitem").allTextContents());
await shot(page, "pois-list__archived-rowmenu", "1440");
await page.keyboard.press("Escape");
// Event: archive from active
row = await myrow("events", "Event");
console.log("Event menu:", await menu(row, "Archive"));
dlg = page.getByRole("dialog");
console.log("ARCHIVE(active event) dialog:", (await dlg.innerText()).replace(/\s+/g, " "));
await shot(page, "events-list__archive-active-confirm", "1440");
await page.keyboard.press("Escape");
await browser.close();
