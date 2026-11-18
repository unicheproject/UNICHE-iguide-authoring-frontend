import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
const F = (n) => `ux-audit/round-1/audit/p6-edge/files/${n}`;
const { browser, context, page } = await open("curator", { viewport: "1440" });
const dtext = async () => (await page.locator("[role=dialog]").first().innerText().catch(()=>"(no dialog)")).replace(/\n+/g," | ").slice(0,1200);
await go(page, `/projects/${P}/media`); await page.waitForTimeout(1200);
await shot(page, "media__list__1440");
await page.getByRole("button",{name:/upload/i}).first().click(); await page.waitForTimeout(800);
log("upload dialog:", await dtext(), "focus", await focused(page)); await shot(page, "upload__open__1440");
const input = page.locator("[role=dialog] input[type=file]");
log("file input accept=", await input.getAttribute("accept"), "multiple=", await input.getAttribute("multiple"));
// too big + wrong type + readme
await input.setInputFiles([F("UX-p6-edge-huge.png"), F("UX-p6-edge-notes.exe"), F("UX-p6-edge-readme.txt")]); await page.waitForTimeout(2500);
log("after bad files:", await dtext(), "alerts", await alerts(page)); await shot(page, "upload__bad-files__1440");
log("dialog buttons", (await page.locator("[role=dialog] button").allTextContents()).map(s=>s.trim()));
await browser.close();
