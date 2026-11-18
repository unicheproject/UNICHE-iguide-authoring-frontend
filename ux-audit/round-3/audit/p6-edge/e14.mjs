import * as H from "./h.mjs";
const log = H.LOG("e14");
const { browser, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
await H.go(page, H.P("/pois/" + H.ids.poi)); await H.sleep(1800);
await page.getByRole("button", { name: "More actions" }).click(); await H.sleep(400);
await page.getByRole("menuitem", { name: /archive/i }).first().click(); await H.sleep(900);
log("archive dialog", { text: (await page.getByRole("dialog").innerText().catch(()=>"NO")).replace(/\s+/g," "), focus: await H.AE(page) });
await H.shot(page, "poi-editor__archive-dialog__1440");
await page.getByRole("dialog").getByRole("button", { name: /^Archive/ }).last().click(); await H.sleep(1800);
log("archived", { msgs: await H.msgs(page), focus: await H.AE(page), live: (await H.live(page)).map(x=>x.role+": "+x.text) });
await H.shot(page, "poi-editor__archived-undo__1440");
const undo = page.getByRole("button", { name: /undo/i }); log("undo count", await undo.count());
if (await undo.count()) { await undo.first().click(); await H.sleep(1500); log("after undo", { msgs: await H.msgs(page), focus: await H.AE(page), live: (await H.live(page)).map(x=>x.text) }); await H.shot(page, "poi-editor__after-undo__1440"); }
// Archive then 503 on undo
await page.getByRole("button", { name: "More actions" }).click(); await H.sleep(400);
await page.getByRole("menuitem", { name: /archive/i }).first().click(); await H.sleep(700);
await page.getByRole("dialog").getByRole("button", { name: /^Archive/ }).last().click(); await H.sleep(1500);
await page.route(api, (r) => r.request().method() === "POST" && /\/status$/.test(new URL(r.request().url()).pathname) ? r.fulfill(H.problem(409, "VERSION_CONFLICT", {currentVersion: 99})) : r.continue());
const u2 = page.getByRole("button", { name: /undo|restore/i }); log("buttons after 2nd archive", await page.getByRole("button").allInnerTexts().then(a=>a.filter(x=>/undo|restore/i.test(x))));
if (await u2.count()) { await u2.first().click(); await H.sleep(1500); log("undo 409", { msgs: await H.msgs(page), focus: await H.AE(page) }); await H.shot(page, "poi-editor__undo-409__1440"); }
await page.unrouteAll({behavior:"ignoreErrors"});
await browser.close();
