import * as H from "./h.mjs";
const log = H.LOG("e13");
const { browser, page } = await H.session();
await H.go(page, H.P("/pois/" + H.ids.poi2)); await H.sleep(1800);
await page.getByRole("button", { name: "Deactivate", exact: true }).first().click(); await H.sleep(1200);
log("deactivate ref", { text: (await page.getByRole("dialog").innerText().catch(()=>"NO DIALOG")).replace(/\s+/g," "), focus: await H.AE(page), links: await page.getByRole("dialog").getByRole("link").allInnerTexts().catch(()=>[]) });
await H.shot(page, "poi-editor__deactivate-referenced__1440");
await page.keyboard.press("Escape"); await H.sleep(500);
log("after esc", { focus: await H.AE(page) });
await page.getByRole("button", { name: "More actions" }).click(); await H.sleep(500);
log("menu", await page.getByRole("menuitem").allInnerTexts());
await H.shot(page, "poi-editor__more-menu__1440");
const arch = page.getByRole("menuitem", { name: /archive/i }); 
if (await arch.count()) { await arch.first().click(); await H.sleep(1200); log("archive ref", { text: (await page.getByRole("dialog").innerText().catch(()=>"NO DIALOG")).replace(/\s+/g," "), focus: await H.AE(page) }); await H.shot(page, "poi-editor__archive-referenced__1440"); }
await browser.close();
