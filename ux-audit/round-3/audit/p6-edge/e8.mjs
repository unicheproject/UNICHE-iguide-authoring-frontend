import * as H from "./h.mjs";
const log = H.LOG("e8");
const { browser, page } = await H.session();
const api = (u) => u.pathname.includes("/iguide/api/");
const kinds = { pois: "New point of interest", places: "New place", routes: "New route", guides: "New guide", events: "New event", categories: "New category" };
for (const [k, btn] of Object.entries(kinds)) {
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await H.go(page, H.P("/" + k)); await H.sleep(1500);
  await page.getByRole("button", { name: btn }).first().click(); await H.sleep(800);
  const dlg = page.getByRole("dialog");
  log(`## ${k} dialog`, { focus: await H.AE(page), labels: await dlg.locator("label").allInnerTexts(), buttons: await dlg.getByRole("button").allInnerTexts() });
  await H.shot(page, `${k}-create__open__1440`);
  // empty submit
  const primary = dlg.getByRole("button", { name: /^Create/ }).first();
  await primary.click(); await H.sleep(700);
  log(`${k} empty submit`, { focus: await H.AE(page), msgs: await H.msgs(page), live: (await H.live(page)).map(x => x.role + ": " + x.text) });
  await H.shot(page, `${k}-create__empty-submit__1440`);
  // fill title
  const first = dlg.locator("input[type=text], input:not([type]), textarea").first();
  await first.fill("UX-R3-p6 create-" + k + " " + Date.now()); 
  // 422 forced
  let posts = 0;
  await page.route(api, (r) => { if (r.request().method() === "POST" && new RegExp(`/${k}$`).test(new URL(r.request().url()).pathname)) { posts++; return r.fulfill(H.problem(422, "VALIDATION_ERROR", { errors: [{ path: k === "categories" ? "name" : "title", code: "TOO_LONG", message: "Title must be at most 200 characters." }, { path: "bogusField", code: "X", message: "Bogus rejected." }] })); } return r.continue(); });
  await dlg.getByRole("button", { name: /^Create/ }).first().click(); await H.sleep(1200);
  log(`${k} 422`, { posts, focus: await H.AE(page), msgs: await H.msgs(page), live: (await H.live(page)).map(x => x.role + ": " + x.text) });
  await H.shot(page, `${k}-create__422__1440`);
  // 500
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.route(api, (r) => { if (r.request().method() === "POST" && new RegExp(`/${k}$`).test(new URL(r.request().url()).pathname)) return r.fulfill(H.problem(503, "SERVICE_UNAVAILABLE")); return r.continue(); });
  await dlg.getByRole("button", { name: /^Create/ }).first().click(); await H.sleep(1200);
  log(`${k} 503`, { focus: await H.AE(page), msgs: await H.msgs(page), canary: (await H.body(page)).includes(H.CANARY) });
  await H.shot(page, `${k}-create__503__1440`);
  await page.keyboard.press("Escape"); await H.sleep(500);
  log(`${k} esc with text`, { dialogs: await page.getByRole("dialog").count(), msgs: await H.msgs(page) });
  await H.shot(page, `${k}-create__esc-with-text__1440`);
  await page.keyboard.press("Escape"); await H.sleep(300);
}
await browser.close();
