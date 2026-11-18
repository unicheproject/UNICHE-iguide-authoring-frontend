import { open, CMS, P, settle, attach, rec, tryDo, here } from "./lib.mjs";
import { readFileSync, writeFileSync } from "node:fs";
const seed = JSON.parse(readFileSync(here + "/../../../tools/seed.json", "utf8"));
const id = (k, key) => seed[k].find((x) => x.key === key).id;
const { browser, page } = await open("curator", { viewport: "1440" });
const e = attach(page, "dialogs");
const base = `${CMS}/projects/${P}`;
const log = (...a) => console.log(...a);
async function step(name, fn) {
  const b = { p: e.pageerror.length, c: e.console.length };
  const ok = await tryDo(name, fn);
  const row = await rec(page, name, { full: false });
  row.errors = { pageerror: e.pageerror.slice(b.p), console: e.console.slice(b.c) };
  log(name, "->", row.h1, "viol", row.violations.map(v=>v.id+":"+v.impact).join(",") , "err", row.errors.pageerror.length, row.errors.console.length, ok === null ? "(step failed)" : "");
}
const closeAny = async () => { await page.keyboard.press("Escape"); await page.waitForTimeout(400); };
// 1. header switcher open
await page.goto(base); await settle(page);
await step("switcher-open", async () => { await page.getByRole("button", { name: /Switch project/i }).click(); await page.waitForTimeout(800); });
await closeAny();
// 2. lists + create dialogs
const lists = [["places","New place|Create place|Add place"],["pois","New point of interest"],["routes","New route"],["guides","New guide"],["events","New event"],["categories","New category"],["maps","New map"],["floor-plans","New floor plan"]];
for (const [path, btn] of lists) {
  await page.goto(`${base}/${path}`); await settle(page);
  await step(`${path}-create-dialog`, async () => { await page.getByRole("button", { name: new RegExp(btn, "i") }).first().click({ timeout: 4000 }); await page.waitForTimeout(900); });
  await closeAny();
}
// 3. POI list: filters open / kebab
await page.goto(`${base}/pois`); await settle(page);
await step("pois-kebab-open", async () => { await page.getByRole("button", { name: /^Actions for/ }).first().click(); await page.waitForTimeout(600); });
await closeAny();
await step("pois-search-empty", async () => { await page.getByRole("searchbox").first().fill("zzzzqqq"); await page.waitForTimeout(1200); });
await page.getByRole("searchbox").first().fill("");
// 4. editors: Activate dialog on draft POI, preview-in-app
await page.goto(`${base}/pois/${id("pois","horsemen")}`); await settle(page);
await step("poi-draft-activate-dialog", async () => { await page.getByRole("button", { name: /Activate/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(900); });
await closeAny();
await step("poi-draft-preview-in-app", async () => { await page.getByRole("button", { name: /Preview in app/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(1500); });
await closeAny();
await step("poi-draft-greek-tab", async () => { await page.getByRole("tab", { name: /Ελληνικά|Greek|el/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(800); });
await page.goto(`${base}/pois/${id("pois","frieze")}`); await settle(page);
await step("poi-pending-greek-tab", async () => { await page.getByRole("tab", { name: /Ελληνικά|Greek/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(800); });
// 5. maps / floor plan new dialogs covered; media upload / picker
await page.goto(`${base}/media`); await settle(page);
await step("media-upload-dialog", async () => { await page.getByRole("button", { name: /Upload/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(900); });
await closeAny();
await step("media-list-view", async () => { await page.getByRole("button", { name: /List/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(800); });
// asset picker from POI editor
await page.goto(`${base}/pois/${id("pois","pediment")}`); await settle(page);
await step("asset-picker", async () => { await page.getByRole("button", { name: /Choose image|Choose from library|Add image|Choose media|Add media|Select/i }).first().click({ timeout: 4000 }); await page.waitForTimeout(1200); });
await closeAny();
// preview page per surface
await page.goto(`${base}/preview`); await settle(page);
for (const s of ["Web", "Mobile", "Kiosk"]) {
  await step(`preview-${s.toLowerCase()}`, async () => { await page.getByRole("tab", { name: new RegExp(s, "i") }).first().click({ timeout: 4000 }).catch(async()=>{ await page.getByRole("radio", { name: new RegExp(s, "i") }).first().click({ timeout: 3000 }); }); await page.waitForTimeout(1200); });
}
writeFileSync(`${here}/errors-dialogs.json`, JSON.stringify(e, null, 1));
await browser.close();
