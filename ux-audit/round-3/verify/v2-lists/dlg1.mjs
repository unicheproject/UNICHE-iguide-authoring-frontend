import { open, go, P, ready, shot, save, focusDesc } from "./h.mjs";
const res = {};
const { browser, page } = await open("admin", { viewport: "1440" });
const geom = () => page.evaluate(() => {
  const d = document.querySelector("[role=dialog]"); if (!d) return null; const r = d.getBoundingClientRect();
  const body = d.querySelector("[data-dialog-body]"); const cs = body && getComputedStyle(body);
  const close = [...d.querySelectorAll("button")].find((b) => /close/i.test(b.getAttribute("aria-label") ?? "")); const cr = close?.getBoundingClientRect();
  const h2 = d.querySelector("h2")?.getBoundingClientRect();
  const labels = [...d.querySelectorAll("label, legend")].map((l) => l.textContent.replace(/\s+/g, " ").trim().slice(0, 40));
  const radios = d.querySelectorAll("input[type=radio]").length, selects = d.querySelectorAll("select,[role=combobox]").length;
  const btns = [...d.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean);
  return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bodyPad: cs ? `${cs.paddingTop}/${cs.paddingRight}/${cs.paddingBottom}/${cs.paddingLeft}` : null, closeTop: cr ? Math.round(cr.top - r.top) : null, closeRight: cr ? Math.round(r.right - cr.right) : null, h2Top: h2 ? Math.round(h2.top - r.top) : null, heading: d.querySelector("h2")?.textContent.trim(), alerts: d.querySelectorAll("[role=alert]").length, labels, radios, selects, btns };
});
const ALL = ["places", "pois", "routes", "guides", "events", "categories"];
for (const k of ALL) {
  await go(page, `/projects/${P}/${k}?create=1`); await ready(page);
  await page.waitForSelector("[role=dialog]", { timeout: 8000 }).catch(() => {});
  res[`${k}-create1`] = { dialog: await page.locator("[role=dialog]").count(), url: page.url().replace(P, "P"), focus: await focusDesc(page), ...(await geom()) };
  await shot(page, `create-${k}__open__1440`);
  await page.getByRole("button", { name: /^Create and open/ }).click(); await page.waitForTimeout(600);
  res[`${k}-empty`] = await geom();
  res[`${k}-emptyFocus`] = await focusDesc(page);
  await shot(page, `create-${k}__empty-submit__1440`);
}
await browser.close();
save("dlg1", res);
for (const [k, v] of Object.entries(res)) console.log(k, JSON.stringify(v));
