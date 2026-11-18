import { open, go, P, ids, shot, settle, alerts, focused, main, problem, AP } from "./lib.mjs";
const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
const dlg = () => page.locator("[role=dialog],[role=alertdialog]").first();
const kinds = [["places", /New place|New Place/], ["pois", /New point/], ["routes", /New route/], ["guides", /New guide/], ["events", /New event/], ["categories", /New categor/]];
for (const [k, re] of kinds) {
  await go(page, `${PP}/${k}`); await settle(page, 900);
  await page.getByRole("button", { name: re }).first().click(); await page.waitForTimeout(700);
  console.log(`\n=== ${k} dialog | focus:`, await focused(page));
  console.log("  fields:", await dlg().evaluate(d => [...d.querySelectorAll("input,select,textarea,button")].map(e => `${e.tagName.toLowerCase()}:${e.type||""}:${(e.getAttribute("aria-label")||e.labels?.[0]?.textContent||e.textContent||e.name||e.id).trim().replace(/\s+/g," ").slice(0,30)}${e.disabled?"(disabled)":""}${e.required?"(req)":""}`).join(" ; ")));
  // empty submit
  const create = dlg().getByRole("button", { name: /^Create/ });
  await create.click(); await page.waitForTimeout(800);
  console.log("  EMPTY submit: alerts", JSON.stringify(await alerts(page)).slice(0, 300), "| focus", await focused(page));
  await shot(page, `${k}-create__empty-submit`);
  // forced 422 + type title
  const title = dlg().locator("input[type=text],input:not([type])").first();
  await title.fill("UX-R2-p6 ZZZ-REJECTED " + k);
  await page.route(AP, (r) => r.request().method() === "POST" ? r.fulfill(problem(422, "VALIDATION_FAILED", { errors: [{ path: k === "categories" ? "name" : "title", code: "NOT_BLANK", message: "Title is not allowed here." }, { path: "slug", code: "INVALID", message: "Slug has a bad character." }] })) : r.continue());
  await create.click(); await page.waitForTimeout(1200);
  console.log("  422: alerts", JSON.stringify(await alerts(page)).slice(0, 400), "| focus", await focused(page));
  console.log("  dialog text:", (await dlg().innerText()).replace(/\n+/g, " | ").slice(0, 400));
  await shot(page, `${k}-create__422`);
  await page.unroute(AP);
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
}
await browser.close();
