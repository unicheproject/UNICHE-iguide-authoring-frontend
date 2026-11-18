import * as H from "./h.mjs";
const log = H.LOG("e1");
const { browser, page } = await H.session();
const id = H.ids.poi;
const isSave = (r) => r.method() === "PUT" && new RegExp(`/pois/${id}$`).test(new URL(r.url()).pathname);
const scen = {
  "403": (r) => r.fulfill(H.problem(403, "FORBIDDEN")),
  "404": (r) => r.fulfill(H.problem(404, "NOT_FOUND")),
  "409": (r) => r.fulfill(H.problem(409, "VERSION_CONFLICT", { currentVersion: 9 })),
  "422": (r) => r.fulfill(H.problem(422, "VALIDATION_ERROR", { errors: [{ path: "translations.en.title", code: "TOO_LONG", message: "Title must be at most 200 characters." }, { path: "latitude", code: "OUT_OF_RANGE", message: "Latitude must be between -90 and 90." }] })),
  "500": (r) => r.fulfill(H.problem(500, "INTERNAL_ERROR")),
  "502": (r) => r.fulfill(H.problem(502, "BAD_GATEWAY")),
  "503": (r) => r.fulfill(H.problem(503, "SERVICE_UNAVAILABLE")),
  "504": (r) => r.fulfill(H.problem(504, "GATEWAY_TIMEOUT")),
  "net": (r) => r.abort("failed"),
  "html502": (r) => r.fulfill({ status: 502, contentType: "text/html", body: "<h1>Bad gateway SECRET-SERVER-DETAIL</h1>" }),
};
for (const [k, fn] of Object.entries(scen)) {
  await H.go(page, H.P("/pois/" + id)); await H.sleep(1500);
  await page.route((u) => u.pathname.includes("/iguide/api/"), (r) => isSave(r.request()) ? fn(r) : r.continue());
  const ta = page.locator("#f-title"); await ta.click(); await page.keyboard.press("End"); await page.keyboard.type(" edited");
  await H.live(page);
  await page.getByRole("button", { name: /^Save/ }).first().click();
  await H.sleep(1800);
  const m = await H.msgs(page); const b = await H.body(page);
  log(`## ${k}`, { canary: b.includes(H.CANARY), focus: await H.AE(page), msgs: m, live: (await H.live(page)).map((x) => x.role + ": " + x.text) });
  await H.shot(page, `poi-editor__save-${k}__1440`);
  await page.unroute((u) => true).catch(() => {});
  await page.unrouteAll({ behavior: "ignoreErrors" });
  // discard unsaved edit: reload and accept guards
  page.once("dialog", (d) => d.accept());
}
await browser.close();
