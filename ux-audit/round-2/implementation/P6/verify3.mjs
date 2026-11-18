import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const OUT = "ux-audit/round-2/implementation/P6/after/";
const PLAN = `/projects/${P}/floor-plans/3b81f75c-3a3e-45a2-9676-89f1d283457b`;
const out = {};
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, PLAN);
  await page.waitForSelector(".plan-plane", { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const names = await page.$$eval("button", (bs) => bs.filter((b) => /^Place\b/.test((b.innerText || "").trim())).map((b) => (b.innerText || "").trim().replace(/\s+/g, " ")));
  out[vp] = { placeButtons: names.length, distinct: new Set(names).size, sample: names.slice(0, 2) };
  if (vp === "1440" || vp === "zoom200") {
    const btn = page.getByRole("button", { name: /^Place / }).first();
    await btn.click();
    await page.waitForTimeout(600);
    const bar = page.locator("[data-armed-bar]");
    const bb = await bar.boundingBox(); const pb = await page.locator(".plan-plane").boundingBox();
    out[vp].bar = bb; out[vp].plane = pb;
    await page.screenshot({ path: OUT + `plan-armed-${vp}.png` });
    // elementFromPoint at top-centre of plane
    out[vp].topCovered = await page.evaluate(() => { const r = document.querySelector(".plan-plane").getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, Math.max(r.top, 130) + 5); return e?.closest("[data-armed-bar]") ? "bar" : e?.tagName; });
    await page.keyboard.press("Escape");
  } else await page.screenshot({ path: OUT + `plan-${vp}.png` });
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
