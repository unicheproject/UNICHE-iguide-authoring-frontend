import * as H from "./h.mjs";
import { join } from "node:path";
const log = H.LOG("e20");
const F = (n) => join(H.here, "files", n);
const { browser, context, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
await H.go(page, H.P("/media")); await H.sleep(1500);
const open = async () => { await page.getByRole("button", { name: /Upload files/ }).first().click(); await H.sleep(600); };
await open(); const dlg = page.getByRole("dialog");
let posts = 0, fail3 = true;
await page.route(api, async (r) => { if (r.request().method() === "POST" && /\/assets$/.test(new URL(r.request().url()).pathname)) { posts++; const n = posts; await H.sleep(2500); if (n === 3 && fail3) return r.fulfill(H.problem(503, "SERVICE_UNAVAILABLE")); if (n === 5 && fail3) return r.fulfill(H.problem(422, "VALIDATION_ERROR", { errors: [{ path: "file", code: "UNSUPPORTED_MEDIA", message: "SECRET-SERVER-DETAIL file rejected." }] })); } return r.continue(); });
const files = [1,2,3,4,5,6,7,8].map((i) => F(`ux-r3-p6-img${i}.png`));
await dlg.locator("input[type=file]").setInputFiles(files); await H.sleep(1500);
log("8 files mid", { text: (await dlg.innerText()).replace(/\s+/g, " ").slice(-600), btns: await dlg.getByRole("button").allInnerTexts() });
await H.shot(page, "upload__8-uploading__1440");
await H.sleep(14000);
log("8 files end", { posts, text: (await dlg.innerText()).replace(/\s+/g, " ").slice(-900), btns: await dlg.getByRole("button").allInnerTexts(), canary: (await H.body(page)).includes(H.CANARY) });
await H.shot(page, "upload__8-done-2-failed__1440");
// retry
fail3 = false;
const retry = dlg.getByRole("button", { name: /retry/i });
log("retry count", await retry.count(), await retry.allInnerTexts());
if (await retry.count()) { await retry.first().click(); await H.sleep(4000); log("after retry", { text: (await dlg.innerText()).replace(/\s+/g, " ").slice(-500), live: (await H.live(page)).slice(-2).map(x=>x.text) }); await H.shot(page, "upload__after-retry__1440"); }
// duplicate: same file again
await dlg.locator("input[type=file]").setInputFiles([F("ux-r3-p6-img1.png")]); await H.sleep(5000);
log("duplicate", { text: (await dlg.innerText()).replace(/\s+/g, " ").slice(-500) });
await H.shot(page, "upload__duplicate__1440");
// cancel mid-upload
await dlg.locator("input[type=file]").setInputFiles([F("ux-r3-p6-img2.png"), F("ux-r3-p6-img3.png")]); await H.sleep(900);
log("mid btns", await dlg.getByRole("button").allInnerTexts());
await page.keyboard.press("Escape"); await H.sleep(800);
log("esc mid-upload", { dlg: await page.getByRole("dialog").count(), text: (await page.getByRole("dialog").allInnerTexts()).join("|").replace(/\s+/g," ").slice(0,400), focus: await H.AE(page) });
await H.shot(page, "upload__esc-mid-upload__1440");
await browser.close();
