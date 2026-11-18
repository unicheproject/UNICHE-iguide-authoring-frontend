import { open, go, P, settle, shot, save, focusDesc } from "./h.mjs";
const res = {};
const ALL = [["places", "New place"], ["pois", "New point of interest"], ["routes", "New route"], ["guides", "New guide"], ["events", "New event"], ["categories", "New category"]];
const { browser, page } = await open("admin", { viewport: "1440" });
const geom = () => page.evaluate(() => {
  const d = document.querySelector("[role=dialog]"); const r = d.getBoundingClientRect();
  const body = d.querySelector("[data-dialog-body]"); const br = body?.getBoundingClientRect(); const cs = body && getComputedStyle(body);
  const close = [...d.querySelectorAll("button")].find((b) => /close/i.test(b.getAttribute("aria-label") ?? "")); const cr = close?.getBoundingClientRect();
  const h2 = d.querySelector("h2")?.getBoundingClientRect();
  return { w: Math.round(r.width), top: Math.round(r.top), bodyPad: cs ? `${cs.paddingTop}/${cs.paddingRight}/${cs.paddingBottom}/${cs.paddingLeft}` : null, closeTop: cr ? Math.round(cr.top - r.top) : null, closeRight: cr ? Math.round(r.right - cr.right) : null, h2Top: h2 ? Math.round(h2.top - r.top) : null, alerts: d.querySelectorAll("[role=alert]").length };
});
for (const [k, label] of ALL) {
  await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 500);
  await page.getByRole("button", { name: label }).first().click(); await settle(page, 500);
  res[`${k}-open`] = await geom();
  await shot(page, `create-${k}__1440`);
  await page.getByRole("button", { name: /^Create and open/ }).click(); await settle(page, 500);
  res[`${k}-empty-submit`] = await geom();
  await shot(page, `create-${k}-empty-submit__1440`);
  await page.keyboard.press("Escape"); await settle(page, 400);
  if (await page.locator("[role=dialog]").count()) await page.getByRole("button", { name: "Cancel" }).click({ timeout: 2000 }).catch(() => {});
  await settle(page, 300);
}
save("dialogs", res);
console.log(JSON.stringify(res, null, 0).replace(/\},"/g, "},\n\""));
await browser.close();
