import { open, go } from "../../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin");
const out = {};
for (const [vp, w, h] of [["1440", 1440, 900], ["zoom200", 640, 360]]) {
  await page.setViewportSize({ width: w, height: h });
  for (const kind of ["pois", "categories"]) {
    await go(page, `/projects/${P}/${kind}`);
    await page.waitForSelector("main [data-variant=primary]"); await page.waitForTimeout(500);
    await page.locator("main [data-variant=primary]").first().click();
    await page.waitForSelector("[role=dialog]"); await page.waitForTimeout(500);
    const measure = () => page.evaluate(() => {
      const d = document.querySelector("[role=dialog]"); const c = d.querySelector("button[aria-label='Close dialog']"); const t = d.querySelector("h2");
      const cy = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; };
      const b = d.querySelector("[data-dialog-body]"); const cs = getComputedStyle(b);
      const p = [...d.querySelectorAll("button")].find((x) => /Create/.test(x.textContent)); const pr = p.getBoundingClientRect();
      const foot = d.querySelector("footer").getBoundingClientRect(); const inner = b.lastElementChild.previousElementSibling ?? b.lastElementChild;
      const form = b.querySelector("form"); const fb = form.getBoundingClientRect();
      return { closeCentre: cy(c), titleCentre: cy(t), bodyPadBottom: cs.paddingBottom, gapFormToFooterRule: Math.round(foot.top - fb.bottom), primaryVisible: pr.top >= 0 && pr.bottom <= innerHeight };
    });
    const k = `${kind}@${vp}`; out[k] = await measure();
    await page.screenshot({ path: `ux-audit/round-3/implementation/W0-A/after/dialog2-${kind}__${vp}.png` });
    if (kind === "pois") { await page.getByRole("button", { name: /Edit slug/ }).click(); await page.waitForTimeout(300); out[k + "+slug"] = await measure(); }
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  }
}
await browser.close(); console.log(JSON.stringify(out, null, 1));
