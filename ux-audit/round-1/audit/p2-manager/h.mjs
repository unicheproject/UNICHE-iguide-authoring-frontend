import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { VIEWPORTS, CMS } from "../../../tools/session.mjs";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
export const { chromium } = require("@playwright/test");
export { VIEWPORTS, CMS };
export const creds = (a) => JSON.parse(readFileSync(new URL("../../../tools/accounts.local", import.meta.url), "utf8"))[a];
export async function fresh(vp = "1440", opts = {}) {
  const browser = await chromium.launch();
  const v = VIEWPORTS[vp];
  const context = await browser.newContext({ viewport: { width: v.width, height: v.height }, deviceScaleFactor: v.deviceScaleFactor ?? 1, ...opts });
  const page = await context.newPage();
  return { browser, context, page };
}
export async function shot(page, name, vp = "1440") {
  await page.screenshot({ path: new URL(`./shots/${name}__${vp}.png`, import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), fullPage: false });
}
export async function uiSignIn(page, account, log = console.log) {
  const c = creds(account);
  const t0 = Date.now();
  await page.goto(CMS + "/");
  await page.waitForLoadState("networkidle").catch(() => {});
  log("landing url after load:", page.url().replace(/\?.*/, ""));
  return { c, t0 };
}
