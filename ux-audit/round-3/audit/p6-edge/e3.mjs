import * as H from "./h.mjs";
const log = H.LOG("e3");
const { browser, context, page } = await H.session();
const id = H.ids.poi;
const isSave = (r) => r.method() === "PUT" && new RegExp(`/pois/${id}$`).test(new URL(r.url()).pathname);
const api = (u) => u.pathname.includes("/iguide/api/");
async function edit(txt = " x") { await page.locator("#f-title").click(); await page.keyboard.press("End"); await page.keyboard.type(txt); }
const saveBtn = () => page.getByRole("button", { name: /^Sav/ }).first();
async function fresh() { await page.unrouteAll({ behavior: "ignoreErrors" }); await H.go(page, H.P("/pois/" + id)); await H.sleep(1500); }
// slow 8s + double click
await fresh(); let puts = 0;
await page.route(api, async (r) => { if (isSave(r.request())) { puts++; await H.sleep(8000); } return r.continue(); });
await edit(" slow"); await H.live(page);
await saveBtn().click(); await saveBtn().click({ force: true }).catch(() => {}); await page.keyboard.press("Control+s");
for (const t of [600, 3000, 5500, 9500]) { await H.sleep(t === 600 ? 600 : 2400); log(`slow t~${t}`, { btn: await saveBtn().innerText(), disabled: await saveBtn().isDisabled(), msgs: (await H.msgs(page)).slice(0, 3), puts }); if (t === 3000) await H.shot(page, "poi-editor__slow-save-3s__1440"); if (t === 5500) await H.shot(page, "poi-editor__slow-save-6s__1440"); }
await H.sleep(3000);
log("slow done", { puts, msgs: await H.msgs(page), live: (await H.live(page)).map(x => x.text) });
// offline mid-save
await fresh(); await edit(" off");
await context.setOffline(true); await H.sleep(800);
log("offline banner", await H.msgs(page)); await H.shot(page, "poi-editor__offline-banner__1440");
await H.live(page);
await saveBtn().click(); await H.sleep(1500);
log("offline save click", { msgs: await H.msgs(page), focus: await H.AE(page), live: (await H.live(page)).map(x=>x.role+": "+x.text) });
await H.shot(page, "poi-editor__offline-save__1440");
await page.locator("#f-title").click(); await page.keyboard.press("Control+s"); await H.sleep(1200);
log("offline ctrl+s", { msgs: await H.msgs(page), live: (await H.live(page)).map(x=>x.role+": "+x.text) });
await H.shot(page, "poi-editor__offline-ctrl-s__1440");
await context.setOffline(false); await H.sleep(2500);
log("back online", { msgs: await H.msgs(page), live: (await H.live(page)).map(x=>x.role+": "+x.text) });
await H.shot(page, "poi-editor__back-online__1440");
await browser.close();
