import { open, go, P, shot, log, alerts, focused, problem } from "./lib.mjs";
const F = (n) => `ux-audit/round-1/audit/p6-edge/files/${n}`;
const { browser, context, page } = await open("curator", { viewport: "1440" });
const dtext = async () => (await page.locator("[role=dialog]").first().innerText().catch(()=>"(no dialog)")).replace(/\n+/g," | ").replace(/Largest file per type.*?Any file\s+200.0 MB\s*\|?/,"[limits] ").slice(0,900);
async function opened() { await go(page, `/projects/${P}/media`); await page.waitForTimeout(800); await page.getByRole("button",{name:/upload/i}).first().click(); await page.waitForTimeout(500); return page.locator("[role=dialog] input[type=file]"); }
// 1 forced failures then retry
let mode = "413"; let posts = 0;
await page.route("**/iguide/api/v1/**/assets", async (route) => { const r=route.request(); if (r.method()!=="POST") return route.continue(); posts++;
  if (mode==="413") return route.fulfill(problem(413,"PAYLOAD_TOO_LARGE",{detail:"Request entity too large"}));
  if (mode==="415") return route.fulfill(problem(415,"UNSUPPORTED_MEDIA_TYPE",{detail:"Unsupported media type application/x-msdownload"}));
  if (mode==="500") return route.fulfill(problem(500,"INTERNAL_ERROR"));
  if (mode==="502") return route.fulfill({status:502, contentType:"text/html", body:"<html>Bad gateway</html>"});
  if (mode==="abort") return route.abort("failed");
  if (mode==="slow") { await new Promise(x=>setTimeout(x,9000)); return route.continue(); }
  return route.continue(); });
let input = await opened();
for (const m of ["413","415","500","502","abort"]) {
  mode = m; await input.setInputFiles(F("UX-p6-edge-ok.png")); await page.waitForTimeout(1500);
  log(`[${m}]`, await dtext(), "alerts", await alerts(page)); await shot(page, `upload__err-${m}__1440`);
}
// retry after failure succeeds
mode = "ok"; await page.getByRole("button",{name:/Retry/}).last().click(); await page.waitForTimeout(2500);
log("[retry ok]", await dtext(), "alerts", await alerts(page)); await shot(page, "upload__retry-ok__1440");
// 2 many files, slow, cancel mid-upload
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
input = await opened(); mode = "slow"; posts = 0;
const many = Array.from({length:12},(_,i)=>F(`UX-p6-edge-many-${i+1}.png`));
await input.setInputFiles(many); await page.waitForTimeout(1500);
log("[many] posts in flight", posts, await dtext()); await shot(page, "upload__many-slow__1440");
log("buttons", (await page.locator("[role=dialog] button").allTextContents()).map(s=>s.trim()));
// cancel one
await page.getByRole("button",{name:/^Cancel UX-p6-edge-many-3/}).click().catch(e=>log("cancel one fail", e.message.slice(0,80)));
await page.waitForTimeout(500);
// try to close mid-upload
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
log("[esc mid-upload]", await dtext(), "focus", await focused(page)); await shot(page, "upload__close-mid-upload__1440");
await page.getByRole("button",{name:/Keep uploading/}).click().catch(()=>{}); await page.waitForTimeout(500);
await page.getByRole("button",{name:/Cancel remaining/}).click().catch(e=>log("no cancel remaining")); await page.waitForTimeout(800);
log("[cancel remaining]", await dtext(), "alerts", await alerts(page)); await shot(page, "upload__cancelled__1440");
await page.unrouteAll({behavior:"ignoreErrors"});
await browser.close();
