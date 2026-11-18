import * as H from "./h.mjs";
const log = H.LOG("e15");
const { browser, page } = await H.session();
await H.go(page, H.P("/pois/" + H.ids.poi)); await H.sleep(1800);
await page.getByRole("button", { name: "Restore as draft" }).first().click(); await H.sleep(1500);
log("restore", { msgs: await H.msgs(page), focus: await H.AE(page) });
await H.go(page, H.P("/pois")); await page.getByRole("searchbox").fill("UX-R3-p6 POI A"); await H.sleep(1200);
const row = page.locator("tbody tr").first();
await row.getByRole("button", { name: /actions|more/i }).first().click(); await H.sleep(500);
log("row menu", await page.getByRole("menuitem").allInnerTexts());
await H.shot(page, "poi-list__row-menu__1440");
await page.getByRole("menuitem", { name: /archive/i }).first().click(); await H.sleep(800);
await page.getByRole("dialog").getByRole("button", { name: /^Archive/ }).last().click(); await H.sleep(1500);
log("list archived", { msgs: await H.msgs(page), focus: await H.AE(page), undo: await page.getByRole("button", { name: /undo/i }).count() });
await H.shot(page, "poi-list__archived-undo__1440");
const u = page.getByRole("button", { name: /undo/i });
if (await u.count()) { await page.getByRole("link", { name: "Routes", exact: true }).first().click(); await H.sleep(1500); log("undo after nav", { undo: await page.getByRole("button", { name: /undo/i }).count(), msgs: await H.msgs(page) }); await H.shot(page, "routes-list__after-archive-nav__1440"); }
await browser.close();
