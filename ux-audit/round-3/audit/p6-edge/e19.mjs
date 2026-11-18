import * as H from "./h.mjs";
import { join } from "node:path";
const log = H.LOG("e19");
const F = (n) => join(H.here, "files", n);
const { browser, context, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
await H.go(page, H.P("/media")); await H.sleep(1500);
await page.getByRole("button", { name: /Upload files/ }).first().click(); await H.sleep(800);
const dlg = page.getByRole("dialog");
log("upload open", { text: (await dlg.innerText()).replace(/\s+/g, " ").slice(0, 700), focus: await H.AE(page) });
await H.shot(page, "upload__open__1440");
const input = dlg.locator("input[type=file]");
// wrong type + too big + good
await input.setInputFiles([F("ux-r3-p6-tool.exe"), F("ux-r3-p6-big.png"), F("ux-r3-p6-big.mp4")]); await H.sleep(2500);
log("bad files", { text: (await dlg.innerText()).replace(/\s+/g, " ").slice(0, 1200), live: (await H.live(page)).map(x => x.text), focus: await H.AE(page) });
await H.shot(page, "upload__wrong-type-too-big__1440");
log("buttons", await dlg.getByRole("button").allInnerTexts());
await browser.close();
