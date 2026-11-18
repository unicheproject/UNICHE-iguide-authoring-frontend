import * as H from "./h.mjs";
import { join } from "node:path";
const log = H.LOG("e21");
const F = (n) => join(H.here, "files", n);
const { browser, context, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
await H.go(page, H.P("/media")); await H.sleep(1500);
await page.getByRole("button", { name: /Upload files/ }).first().click(); await H.sleep(600);
const dlg = page.getByRole("dialog");
await page.route(api, async (r) => { if (r.request().method() === "POST" && /\/assets$/.test(new URL(r.request().url()).pathname)) { await H.sleep(5000); } return r.continue(); });
await dlg.locator("input[type=file]").setInputFiles([13,14,15,16].map(i=>F(`ux-r3-p6-img${i}.png`))); await H.sleep(800);
await dlg.getByRole("button", { name: /^Cancel(?! remaining)/ }).first().click(); await H.sleep(600);
log("cancel one", { text: (await dlg.innerText()).replace(/\s+/g, " ").slice(-420), live:(await H.live(page)).slice(-1).map(x=>x.text.slice(-200)), focus: await H.AE(page) });
await H.shot(page, "upload__cancel-one__1440");
await dlg.getByRole("button", { name: /Cancel remaining/ }).click(); await H.sleep(800);
log("cancel remaining", { text: (await dlg.innerText()).replace(/\s+/g, " ").slice(-420), btns: await dlg.getByRole("button").allInnerTexts(), focus: await H.AE(page) });
await H.shot(page, "upload__cancel-remaining__1440");
await H.sleep(6000);
log("after cancels", (await dlg.innerText()).replace(/\s+/g, " ").slice(-420));
const dn = dlg.getByRole("button", { name: /Describe now/ });
log("describe btn", await dn.count());
await page.unrouteAll({behavior:"ignoreErrors"});
if (await dn.count()) {
  await page.route(api, (r) => /\/ai|describe|suggest/i.test(r.request().url()) && r.request().method()!=="GET" ? r.fulfill(H.problem(503, "SERVICE_UNAVAILABLE")) : r.continue());
  await dn.click(); await H.sleep(2500);
  log("describe now", { url: page.url().replace(H.PID,"PID"), text: (await page.getByRole("dialog").allInnerTexts()).join("|").replace(/\s+/g," ").slice(0,500), msgs: await H.msgs(page) });
  await H.shot(page, "upload__describe-now__1440");
}
await browser.close();
