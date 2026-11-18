import * as H from "./h.mjs";
const log = H.LOG("e2");
const { browser, context, page } = await H.session();
const id = H.ids.poi;
const isSave = (r) => r.method() === "PUT" && new RegExp(`/pois/${id}$`).test(new URL(r.url()).pathname);
const api = (u) => u.pathname.includes("/iguide/api/");
async function edit(txt = " e2") { await page.locator("#f-title").click(); await page.keyboard.press("End"); await page.keyboard.type(txt); }
const save = () => page.getByRole("button", { name: /^Save/ }).first().click();
async function fresh() { await page.unrouteAll({ behavior: "ignoreErrors" }); await H.go(page, H.P("/pois/" + id)); await H.sleep(1500); }
// 401 once
await fresh(); let n = 0; let puts = 0;
await page.route(api, (r) => { if (isSave(r.request())) { puts++; if (n++ === 0) return r.fulfill(H.problem(401, "UNAUTHENTICATED")); } return r.continue(); });
await edit(); await save(); await H.sleep(3000);
log("## 401 once", { puts, msgs: await H.msgs(page), focus: await H.AE(page), url: page.url().includes("/realms/") ? "REALMS" : "cms" });
await H.shot(page, "poi-editor__401-once__1440");
// 401 persistent
await fresh(); let navs = 0; page.on("framenavigated", (f) => { if (f === page.mainFrame()) navs++; });
await page.route(api, (r) => r.request().method() === "GET" && !isSave(r.request()) && !/\/(pois|places|categories|languages|assets)/.test(r.request().url()) ? r.continue() : isSave(r.request()) || r.request().method() !== "GET" ? r.fulfill(H.problem(401, "UNAUTHENTICATED")) : r.continue());
await edit(" persistent401"); await save(); await H.sleep(4000);
log("## 401 persistent", { navs, msgs: await H.msgs(page), focus: await H.AE(page), url: page.url().replace(H.PID, "PID") });
await H.shot(page, "poi-editor__401-persistent__1440");
const dlg = page.getByRole("dialog");
log("dialog buttons", await dlg.getByRole("button").allInnerTexts().catch(() => "none"));
await page.keyboard.press("Escape"); await H.sleep(700);
log("after Esc", { dialog: await dlg.count(), focus: await H.AE(page), msgs: await H.msgs(page), title: await page.locator("#f-title").inputValue().catch(() => null) });
await H.shot(page, "poi-editor__401-persistent-dismissed__1440");
await page.keyboard.press("Control+s"); await H.sleep(1500);
log("Ctrl+S after dismiss", { dialog: await dlg.count(), msgs: await H.msgs(page) });
await H.shot(page, "poi-editor__401-ctrl-s-after-dismiss__1440");
await browser.close();
