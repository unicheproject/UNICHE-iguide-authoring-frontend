import * as H from "./h.mjs";
const log = H.LOG("e31");
const { browser, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
await H.go(page, H.P("/pois/" + H.ids.poi)); await H.sleep(1500);
await page.route(api, (r) => ["PUT","POST"].includes(r.request().method()) ? r.fulfill(H.problem(401,"UNAUTHENTICATED")) : r.continue());
await page.locator("#f-title").click(); await page.keyboard.press("End"); await page.keyboard.type(" resign");
const urls = []; page.on("framenavigated", (f) => { if (f === page.mainFrame()) urls.push(f.url().replace(H.PID,"PID").slice(0,90)); });
await page.getByRole("button", { name: /^Save/ }).first().click(); await H.sleep(3500);
log("dialog", { dialogs: await page.getByRole("dialog").count(), focus: await H.AE(page) });
// Tab cycles inside the dialog?
const seq = []; for (let i=0;i<4;i++){ await page.keyboard.press("Tab"); seq.push(await H.AE(page)); } log("tab order", seq);
await page.unrouteAll({behavior:"ignoreErrors"});
await page.getByRole("button", { name: "Sign in again" }).click();
await page.waitForURL((u) => !/realms/.test(u.toString()), { timeout: 40000 }).catch(()=>{}); await H.sleep(4000);
log("after sign-in", { urls, url: page.url().replace(H.PID,"PID"), msgs: (await H.msgs(page)).filter(m=>/nsaved|Restore/.test(m)), title: await page.locator("#f-title").inputValue().catch(()=>null) });
await H.shot(page, "poi-editor__after-resign-in__1280");
await browser.close();
