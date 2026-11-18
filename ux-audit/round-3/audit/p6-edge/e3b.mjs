import * as H from "./h.mjs";
const log = H.LOG("e3");
const { browser, context, page } = await H.session();
const id = H.ids.poi;
const isSave = (r) => r.method() === "PUT" && new RegExp(`/pois/${id}$`).test(new URL(r.url()).pathname);
const api = (u) => u.pathname.includes("/iguide/api/");
async function edit(txt = " x") { await page.locator("#f-title").click(); await page.keyboard.press("End"); await page.keyboard.type(txt); }
const saveBtn = () => page.getByRole("button", { name: /^Sav/ }).first();
async function fresh() { await page.unrouteAll({ behavior: "ignoreErrors" }); await H.go(page, H.P("/pois/" + id)); await H.sleep(1500); }
// offline mid-save
await fresh(); await edit(" off");
await context.setOffline(true); await H.sleep(800);
log("offline banner", await H.msgs(page)); await H.shot(page, "poi-editor__offline-banner__1440");
await H.live(page);
await saveBtn().click({force:true}); await H.sleep(1500);
log("offline save click", { msgs: await H.msgs(page), focus: await H.AE(page), live: (await H.live(page)).map(x=>x.role+": "+x.text) });
await H.shot(page, "poi-editor__offline-save__1440");
await page.locator("#f-title").click(); await page.keyboard.press("Control+s"); await H.sleep(1200);
log("offline ctrl+s", { msgs: await H.msgs(page), live: (await H.live(page)).map(x=>x.role+": "+x.text) });
await H.shot(page, "poi-editor__offline-ctrl-s__1440");
await context.setOffline(false); await H.sleep(2500);
log("back online", { msgs: await H.msgs(page), live: (await H.live(page)).map(x=>x.role+": "+x.text) });
await H.shot(page, "poi-editor__back-online__1440");
await browser.close();
