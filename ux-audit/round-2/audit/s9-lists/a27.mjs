import { open, go, shot, POP, focusDesc, problem } from "./lib.mjs";
const { browser, context, page } = await open("curator", { viewport: "1440" });
// live region while typing
await go(page, `/projects/${POP}/events`); await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900);
await page.getByLabel("Search", { exact: true }).fill("lecture");
const lv = []; for (let i = 0; i < 6; i++) { await page.waitForTimeout(250); lv.push(await page.locator("[role=status]").allTextContents().then((a) => a.join("|"))); }
console.log("live after typing:", JSON.stringify(lv), "rows", await page.locator("tbody tr").count());
await page.getByRole("checkbox", { name: "Featured only" }).check(); await page.waitForTimeout(700);
console.log("live after toggle:", await page.locator("[role=status]").allTextContents());
// Translation sort order
await go(page, `/projects/${POP}/pois?sort=translations`); await page.waitForTimeout(900);
console.log("translations sort asc first dots:", await page.locator("tbody tr").evaluateAll((r) => r.slice(0, 4).concat(r.slice(-2)).map((x) => x.innerText.replace(/\s+/g, " ").match(/English[^]*$/)?.[0].slice(0, 80))));
// status mock failures on my Place
const rxS = /:8080\/iguide\/api\/v1\/projects\/[^/]+\/places\/[^/]+\/status/;
for (const [label, fn] of [["409", (r) => r.fulfill(problem(409, "VERSION_CONFLICT"))], ["404", (r) => r.fulfill(problem(404, "RESOURCE_NOT_FOUND"))], ["503", (r) => r.fulfill(problem(503, "SERVICE_UNAVAILABLE"))], ["abort", (r) => r.abort("internetdisconnected")]]) {
  await go(page, `/projects/${POP}/places?q=${encodeURIComponent("UX-R2-s9 Place")}`); await page.waitForTimeout(900);
  await page.route(rxS, fn);
  await page.locator("tbody tr").first().locator("button[aria-label^='Actions for']").click();
  await page.getByRole("menuitem", { name: /^Deactivate$/ }).click(); await page.waitForTimeout(800);
  await page.getByRole("dialog").getByRole("button", { name: /^Deactivate/ }).click(); await page.waitForTimeout(1500);
  console.log(label, "-> dialogs", await page.getByRole("dialog").count(), "| dialog:", (await page.getByRole("dialog").innerText().catch(() => "")).replace(/\s+/g, " ").slice(-200), "| toasts:", (await page.locator("[role=status],[role=alert]").allTextContents()).filter(Boolean), "| focus", await focusDesc(page));
  await shot(page, `places-list__deactivate-fail-${label}`, "1440");
  await page.unroute(rxS);
  if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
}
await browser.close();
