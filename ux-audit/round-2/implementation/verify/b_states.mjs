import { open, CMS, P, ED, settle, attach, rec, tryDo, here } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const vp = process.argv[2] ?? "1440";
const seed = JSON.parse(readFileSync(here + "/../../../tools/seed.json", "utf8"));
const id = (k, key) => seed[k].find((x) => x.key === key).id;
const { browser, page } = await open("admin", { viewport: vp });
const e = attach(page, "states-" + vp);
const base = `${CMS}/projects/${P}`;
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;
const fails = [];
async function step(name, fn, opts = {}) {
  if (only && !only.includes(name)) return;
  const b = { p: e.pageerror.length, c: e.console.length };
  let ok = true;
  try { await fn(); } catch (err) { ok = false; fails.push(`${name}: ${String(err.message).split("\n")[0]}`); }
  const row = await rec(page, name, { full: opts.full ?? false, vp });
  row.stepOk = ok;
  row.errors = { pageerror: e.pageerror.slice(b.p), console: e.console.slice(b.c) };
  console.log(name, ok ? "" : "(STEP FAILED)", "|", row.h1, "| ov", row.overlay, "hs", row.hscroll, "viol", row.violations.map(v=>v.id+":"+v.impact+":"+v.n).join(","), "err", row.errors.pageerror.length, row.errors.console.length);
}
const esc = async () => { await page.keyboard.press("Escape"); await page.waitForTimeout(500); };
const go = async (u) => { await page.goto(u); await settle(page, 1200); };
const btn = (re) => page.getByRole("button", { name: re }).first();
const lists = [["places","New place"],["pois","New point of interest"],["routes","New route"],["guides","New guide"],["events","New event"],["categories","New category"]];
const full = vp === "1440";
if (full) {
  await go(base); await step("switcher-open", async () => { await btn(/Switch project|Choose a project|UX Audit/i).click(); await page.waitForTimeout(800); }); await esc();
  await go(CMS + "/projects/new"); await step("create-project-step1", async () => {});
  await go(`${CMS}/projects/${ED}`); await step("dashboard-emptyD-first-run", async () => {});
  // pristine empty via mocks
  await page.route(/\/projects\/6958c18f[^/]*\/(places|pois|routes|guides|events|categories)(\?.*)?$/, async (r) => {
    if (r.request().method() !== "GET" || r.request().resourceType() === "document") return r.continue();
    await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [], page: 0, size: 200, totalElements: 0, totalPages: 0 }) });
  });
  await go(`${base}/pois`); await step("pois-pristine-empty", async () => {});
  await page.unroute(/\/projects\/6958c18f[^/]*\/(places|pois|routes|guides|events|categories)(\?.*)?$/);
}
for (const [path, label] of lists) {
  if (vp !== "1440" && path !== "pois") continue;
  await go(`${base}/${path}`);
  await step(`${path}-create-dialog`, async () => { await btn(new RegExp(label, "i")).click({ timeout: 4000 }); await page.waitForTimeout(900); });
  await esc();
  if (full) {
    await go(`${base}/${path}?create=1`); await step(`${path}-create-param`, async () => { await page.waitForTimeout(600); });
    await esc();
  }
}
if (full) {
  for (const [path] of lists) {
    await go(`${base}/${path}`);
    await step(`${path}-filters`, async () => { await btn(/^Filters/i).click({ timeout: 4000 }); await page.waitForTimeout(700); }); await esc();
    await step(`${path}-row-menu`, async () => { await btn(/^Actions for/).click({ timeout: 4000 }); await page.waitForTimeout(600); }); await esc();
  }
}
// editors
const ed = [["poi-draft", `pois/${id("pois","horsemen")}`], ["poi-active", `pois/${id("pois","pediment")}`], ["poi-pending", `pois/${id("pois","frieze")}`]];
if (vp === "zoom200") await go(`${base}/pois/${id("pois","frieze")}`), await step("poi-editor", async () => {}, { full: true });
if (vp === "768") { await go(`${base}/pois/${id("pois","frieze")}`); await step("poi-editor-drawer", async () => { await btn(/On this page|Sections|Menu/i).click({ timeout: 3000 }).catch(()=>{}); await page.waitForTimeout(600); }); }
if (full) {
  await go(`${base}/pois/${id("pois","horsemen")}`);
  await step("poi-draft-activate-dialog", async () => { await btn(/^Activate/i).click({ timeout: 4000 }); await page.waitForTimeout(900); }); await esc();
  await step("poi-draft-preview-in-app", async () => { await btn(/Preview in app/i).click({ timeout: 4000 }); await page.waitForTimeout(1500); });
  await step("poi-draft-preview-expanded", async () => { await btn(/^Expand/i).click({ timeout: 4000 }); await page.waitForTimeout(1200); }); await esc(); await esc();
  await step("poi-draft-greek-tab", async () => { await page.getByRole("tab", { name: /Ελληνικά|Greek/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(800); });
  await go(`${base}/pois/${id("pois","pediment")}`);
  await step("poi-active-greek-tab", async () => { await page.getByRole("tab", { name: /Ελληνικά|Greek/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(800); });
  await go(`${base}/pois/${id("pois","frieze")}`);
  await step("poi-pending-apply-dialog", async () => { await btn(/Apply changes/i).click({ timeout: 4000 }); await page.waitForTimeout(900); }); await esc();
  // other kinds: activate dialog on a draft + greek tab
  for (const [n, p] of [["route", `routes/${id("routes","agora")}`], ["place", `places/${id("places","gf")}`]]) {
    await go(`${base}/${p}`);
    await step(`${n}-draft-activate-dialog`, async () => { await btn(/^Activate/i).click({ timeout: 4000 }); await page.waitForTimeout(900); }); await esc();
    await step(`${n}-greek-tab`, async () => { await page.getByRole("tab", { name: /Ελληνικά|Greek/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(800); });
  }
  for (const [n, p] of [["guide", `guides/${id("guides","parthenon")}`], ["event", `events/${id("events","fullmoon")}`], ["category", `categories/${id("categories","monuments")}`]]) {
    await go(`${base}/${p}`);
    await step(`${n}-greek-tab`, async () => { await page.getByRole("tab", { name: /Ελληνικά|Greek/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(800); });
  }
  // forced 409: type into the title then Save draft with PUT mocked
  await go(`${base}/pois/${id("pois","horsemen")}`);
  await page.route(/\/pois\/cb763579[^/]*$/, async (r) => {
    if (r.request().method() === "PUT" || r.request().method() === "PATCH") return r.fulfill({ status: 409, contentType: "application/problem+json", body: JSON.stringify({ code: "VERSION_CONFLICT", message: "SECRET-SERVER-DETAIL", requestId: "req-verify-409" }) });
    return r.continue();
  });
  await step("poi-409-dialog", async () => {
    const f = page.locator("main input[type=text], main textarea").first(); await f.click(); await page.keyboard.type(" x"); await page.waitForTimeout(300);
    await page.keyboard.press("Control+s"); await page.waitForTimeout(1800);
  });
  const leak = await page.evaluate(() => document.body.innerText.includes("SECRET-SERVER-DETAIL"));
  console.log("409 leaks server text:", leak);
  await page.unroute(/\/pois\/cb763579[^/]*$/);
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  // maps / floor plans
  await go(`${base}/maps`); await step("maps-new-dialog", async () => { await btn(/New map/i).click({ timeout: 4000 }); await page.waitForTimeout(900); }); await esc();
  await go(`${base}/floor-plans`); await step("floorplans-new-dialog", async () => { await btn(/New floor plan/i).click({ timeout: 4000 }); await page.waitForTimeout(900); }); await esc();
  await go(`${base}/media`); await step("media-upload-dialog", async () => { await btn(/Upload/i).click({ timeout: 4000 }); await page.waitForTimeout(900); }); await esc();
  await step("media-filters", async () => { await btn(/Filters/i).click({ timeout: 4000 }); await page.waitForTimeout(700); }); await esc();
  await go(`${base}/pois/${id("pois","pediment")}`);
  await step("asset-picker", async () => { await btn(/Choose image|Choose from library|Add image|Choose media|Add media|Change image|Replace/i).click({ timeout: 4000 }); await page.waitForTimeout(1200); }); await esc();
  await go(`${base}/preview`);
  for (const s of ["Web", "Mobile", "Kiosk"]) await step(`preview-${s.toLowerCase()}`, async () => { await page.getByRole("tab", { name: new RegExp(s, "i") }).first().click({ timeout: 4000 }).catch(async()=>{ await page.getByRole("radio", { name: new RegExp(s, "i") }).first().click({ timeout: 3000 }); }); await page.waitForTimeout(1200); });
  // forced errors
  await page.route(/\/projects\/6958c18f[^/]*\/pois(\?.*)?$/, (r) => r.request().resourceType() === "document" ? r.continue() : r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ code: "UPSTREAM", message: "SECRET-SERVER-DETAIL", detail: "SECRET-SERVER-DETAIL", requestId: "req-verify-503" }) }));
  await go(`${base}/pois`); await step("pois-503", async () => {});
  console.log("503 leaks:", await page.evaluate(() => document.body.innerText.includes("SECRET-SERVER-DETAIL")));
  await page.unroute(/\/projects\/6958c18f[^/]*\/pois(\?.*)?$/);
  await page.route(/\/projects\/6958c18f[^/]*\/pois(\?.*)?$/, (r) => r.request().resourceType() === "document" ? r.continue() : r.fulfill({ status: 403, contentType: "application/problem+json", body: JSON.stringify({ code: "FORBIDDEN", detail: "SECRET-SERVER-DETAIL", requestId: "req-verify-403" }) }));
  await go(`${base}/pois`); await step("pois-403", async () => {});
  console.log("403 leaks:", await page.evaluate(() => document.body.innerText.includes("SECRET-SERVER-DETAIL")));
  await page.unroute(/\/projects\/6958c18f[^/]*\/pois(\?.*)?$/);
  await page.route(/\/projects\/6958c18f[^/]*$/, (r) => r.request().method() === "GET" && r.request().resourceType() !== "document" ? r.fulfill({ status: 404, contentType: "application/problem+json", body: JSON.stringify({ code: "NOT_FOUND", detail: "SECRET-SERVER-DETAIL", requestId: "req-verify-404" }) }) : r.continue());
  await go(`${base}/pois`); await step("project-404", async () => {});
  console.log("404 leaks:", await page.evaluate(() => document.body.innerText.includes("SECRET-SERVER-DETAIL")));
  await page.unroute(/\/projects\/6958c18f[^/]*$/);
  await page.route(/\/projects\/6958c18f[^/]*$/, (r) => r.request().method() === "GET" && r.request().resourceType() !== "document" ? r.fulfill({ status: 403, contentType: "application/problem+json", body: JSON.stringify({ code: "FORBIDDEN", requestId: "req-verify-403b" }) }) : r.continue());
  await go(`${base}`); await step("project-403", async () => {});
  await page.unroute(/\/projects\/6958c18f[^/]*$/);
  // app preview new tab: bare route already covered in a_routes
}
writeFileSync(`${here}/errors-states-${vp}.json`, JSON.stringify(e, null, 1));
writeFileSync(`${here}/stepfails-${vp}.txt`, fails.join("\n"));
console.log("FAILS:\n" + fails.join("\n"));
await browser.close();
