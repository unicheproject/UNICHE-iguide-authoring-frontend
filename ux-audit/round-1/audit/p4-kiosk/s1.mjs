import { open, go, P, shot, small } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const log = (...a) => console.log(...a);
await go(page, `/projects/${P}/preview`); await page.waitForTimeout(1500);
await shot(page, "preview__default__1440", true);
for (const s of ["KIOSK","MOBILE","WEB"]) {
  await page.getByRole("button", { name: new RegExp("^"+s+"$","i") }).click(); await page.waitForTimeout(500);
  await shot(page, `preview__${s}__1440`, true);
}
// languages
const langs = await page.locator('[role=group][aria-label=Language] button').allTextContents(); log("langs", langs);
await page.getByRole("button", { name: /^kiosk$/i }).click();
for (const l of langs.slice(1,3)) { await page.getByRole("button", { name: l, exact: true }).click(); await page.waitForTimeout(400); await shot(page, `preview__KIOSK-${l}__1440`, true); }
await page.getByRole("button", { name: "Live content" }).click(); await page.waitForTimeout(400); await shot(page, `preview__KIOSK-live__1440`, true);
log("status", await page.locator("[aria-live=polite]").first().textContent());
// triggers
const opts = await page.locator("select option").allTextContents(); log("triggers", opts);
await page.getByRole("button", { name: "Working content" }).click();
for (const surf of ["KIOSK","MOBILE"]) {
  await page.getByRole("button", { name: new RegExp("^"+surf+"$","i") }).click();
  const sel = page.locator("select").first();
  const vals = await sel.locator("option").evaluateAll(o => o.map(x => [x.value, x.textContent]));
  for (const kind of ["QR", "Geo", "Beacon", "Proximity"]) {
    const o = vals.find(v => v[1].toLowerCase().includes(kind.toLowerCase()) && v[0]);
    if (!o) continue;
    await sel.selectOption(o[0]); await page.waitForTimeout(600);
    await shot(page, `preview__fire-${kind}-${surf}__1440`, true); log("fired", surf, o[1]);
  }
}
// no-triggers? keyboard focus
await page.keyboard.press("Tab");
await browser.close();
