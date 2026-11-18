// axe over key states at a viewport
import * as H from "./h.mjs";
const log = H.LOG("a2"); const vp = process.argv[2] || "1440";
const { browser, page } = await H.session({ viewport: vp });
const S = H.seed; const res = []; const poi = (k) => S.pois.find((p) => p.key === k).id;
const A = async (name) => { const v = await H.axe(page, name, res); log(vp, name, "viol=", JSON.stringify(v)); await H.shot(page, `states__${name}__${vp}`); };
const T = async (name, fn) => { try { await fn(); } catch (e) { log(vp, name, "ERR", e.message.split("\n")[0].slice(0, 160)); } };
const lists = ["pois", "places", "routes", "guides", "events", "categories", "maps", "floor-plans", "media"];
for (const l of lists) await T("list-" + l, async () => {
  await H.go(page, H.P("/" + l)); await H.sleep(1800);
  const fb = page.getByRole("button", { name: /^Filters/ }).first();
  if (await fb.count()) { await fb.click(); await H.sleep(500); await A(`filters-${l}`); await page.keyboard.press("Escape"); await H.sleep(300); }
  const menu = page.getByRole("button", { name: /^(More|Actions|Row)/i }).first();
  if (await menu.count()) { await menu.click(); await H.sleep(500); await A(`rowmenu-${l}`); await page.keyboard.press("Escape"); await H.sleep(300); }
  else log(vp, "no row menu button on", l);
});
for (const l of ["pois", "places", "routes", "guides", "events", "categories", "maps", "floor-plans"]) await T("create-" + l, async () => {
  await H.go(page, H.P(`/${l}?create=1`)); await H.sleep(1500); await A(`create-${l}`);
  const d = page.getByRole("dialog"); const t = d.getByLabel(/^(Title|Name)/).first();
  if (await t.count()) { await t.fill("x"); await t.fill(""); await page.getByRole("button", { name: /^Create/ }).first().click(); await H.sleep(700); await A(`create-${l}-invalid`); }
});
await T("upload", async () => { await H.go(page, H.P("/media")); await H.sleep(1500); await page.getByRole("button", { name: /^Upload/ }).first().click(); await H.sleep(600); await A("upload-dialog"); });
H.dump(`axe-states-${vp}.json`, res); await browser.close();
