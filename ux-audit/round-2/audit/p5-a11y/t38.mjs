import * as L from "./lib.mjs";
const { page, context, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
const POI = "35d91cba-d64a-43ce-9773-1e472226d028";
const prob = (status, code, extra = {}) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:x", code, title: "Version conflict", status, requestId: "req-r2p5-" + status, ...extra }) });
let mode = null;
await page.route((u) => u.toString().includes(":8080") && u.toString().includes("/pois/" + POI), (r) => {
  const m = r.request().method();
  if (mode === "409" && ["PUT", "PATCH"].includes(m)) return r.fulfill(prob(409, "VERSION_CONFLICT"));
  if (mode === "500" && ["PUT", "PATCH"].includes(m)) return r.fulfill(prob(500, "INTERNAL_ERROR", { title: "Internal error" }));
  return r.continue();
});
await L.nav(page, L.P("/pois/" + POI), 1800);
await L.watchLive(page);
for (const md of ["409", "500"]) {
  mode = md;
  await page.getByRole("textbox", { name: "Summary" }).first().focus(); await k.type(" x"); await k.press("Control+s"); await page.waitForTimeout(2200);
  L.log("t38", md, "save: focus", await L.focus(page), "dialogs", await page.locator("[role=dialog],[role=alertdialog]").evaluateAll((d) => d.map((x) => x.innerText.slice(0, 300).replace(/\n+/g, " | "))), "alerts", await page.locator("[role=alert]").allTextContents(), "live", (await L.liveLog(page)).slice(-3));
  await L.shot(page, `poi-editor__${md}-save__1440`);
  if (await page.locator("[role=dialog],[role=alertdialog]").count()) { await k.press("Escape"); await page.waitForTimeout(500); L.log("t38", md, "after Esc focus", await L.focus(page)); }
}
mode = null;
await context.setOffline(true); await page.waitForTimeout(800);
await page.getByRole("textbox", { name: "Summary" }).first().focus(); await k.type(" y"); await k.press("Control+s"); await page.waitForTimeout(2500);
L.log("t38", "offline save: focus", await L.focus(page), "alerts", await page.locator("[role=alert]").allTextContents(), "live", (await L.liveLog(page)).slice(-4), "save btn disabled?", await page.getByRole("button", { name: /^Save/ }).first().isDisabled());
await L.shot(page, "poi-editor__offline-save__1440");
await context.setOffline(false); await page.waitForTimeout(4000);
L.log("t38", "online again: live", (await L.liveLog(page)).slice(-3));
await browser.close();
