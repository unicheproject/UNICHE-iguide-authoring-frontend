import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
const tabs = async () => (await page.locator("[role=tab]").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")))).join(" / ");
await go(page, `/projects/${PID}/pois/${ids.poi}`);
await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(2000);
// 422 on a Greek field while viewing the Italian tab
await page.route(new RegExp(`/pois/${ids.poi}$`), async (route) => {
  if (route.request().method() !== "PUT") return route.continue();
  await route.fulfill({ status: 422, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:VALIDATION_FAILED", title: "Validation failed", status: 422, code: "VALIDATION_FAILED", detail: "One or more fields are invalid.", requestId: "r2p3-422-test", errors: [{ path: "translations.el.title", code: "SIZE", message: "must be at most 200 characters" }, { path: "translations.it.summary", code: "SIZE", message: "must be at most 500 characters" }] }) });
});
await page.getByRole("tab", { name: /Italiano/ }).click(); await page.waitForTimeout(400);
await page.getByLabel("Summary in Italiano").fill("Prova di errore " + Date.now());
await page.keyboard.press("Control+s"); await page.waitForTimeout(2000);
await shot(page, "poi-editor__422-on-greek-field-while-on-italian-tab");
console.log("tabs after 422:", await tabs());
console.log("alerts:", (await page.locator("[role=alert]").allInnerTexts()).join(" || ").replace(/\n+/g," ").slice(0,500));
console.log("active tab:", await page.locator("[role=tab][aria-selected=true]").innerText().then(t=>t.replace(/\n/g," ")));
console.log("focus:", await page.evaluate(() => document.activeElement?.tagName + "|" + (document.activeElement?.innerText||"").slice(0,60)));
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(400);
console.log("el title invalid:", await page.getByLabel("Title in Ελληνικά").getAttribute("aria-invalid"), "| err text near:", (await page.locator("#panel-el").innerText()).includes("at most 200"));
await shot(page, "poi-editor__422-greek-tab");
await page.unroute(new RegExp(`/pois/${ids.poi}$`));
// 409
await page.route(new RegExp(`/pois/${ids.poi}$`), async (route) => {
  if (route.request().method() !== "PUT") return route.continue();
  await route.fulfill({ status: 409, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:VERSION_CONFLICT", title: "Version conflict", status: 409, code: "VERSION_CONFLICT", detail: "The resource was changed by someone else.", requestId: "r2p3-409-test" }) });
});
await page.getByRole("tab", { name: /Italiano/ }).click(); await page.waitForTimeout(300);
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
await shot(page, "poi-editor__409-conflict-italian");
console.log("409 alerts:", (await page.locator("[role=alert], [role=dialog]").allInnerTexts()).join(" || ").replace(/\n+/g," ").slice(0,600));
await browser.close();
