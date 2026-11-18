import { open, go, VIEWPORTS } from "../../../tools/session.mjs";
import { createRequire } from "node:module";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const MAP = `/projects/${P}/maps/f8daa876-f2af-4552-95ae-431c96ed1b2d`;
const OUT = "ux-audit/round-2/implementation/P6/after/";
const out = {};
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, MAP);
  await page.waitForSelector(".leaflet-container", { timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: OUT + `map-${vp}.png`, fullPage: false });
  if (vp === "1440") {
    // Tab stops from map to Placed
    await page.locator(".leaflet-container").first().focus().catch(() => {});
    const stops = await page.evaluate(async () => {
      const hits = [];
      return null;
    });
    // count focusables between map and #placed heading
    const n = await page.evaluate(() => {
      const map = document.querySelector(".geo-map");
      const placed = document.getElementById("placed");
      const all = [...document.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]")].filter((e) => e.tabIndex >= 0 && e.getClientRects().length);
      const after = all.filter((e) => map.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING && !(map.contains(e)));
      const upto = after.filter((e) => placed.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING);
      const inside = all.filter((e) => map.contains(e));
      return { inside: inside.length, between: upto.length };
    });
    out.tabStops = n;
    // filter disclosure
    const btn = page.getByRole("button", { name: /Try the visitor filter/ });
    out.filterButton = await btn.count();
    await btn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: OUT + `map-filter-open-1440.png` });
    await btn.click();
    // blur validation
    const lat = page.getByLabel("Latitude", { exact: true }).first();
    await lat.fill("abc");
    await page.getByLabel("Longitude", { exact: true }).first().focus();
    await page.waitForTimeout(300);
    out.latInvalid = await lat.getAttribute("aria-invalid");
    out.latErr = await page.locator("#f-initialLatitude-error").innerText().catch(() => null);
    out.live = await page.evaluate(() => [...document.querySelectorAll("[aria-live=polite]")].map((e) => e.textContent).join("|"));
    await lat.scrollIntoViewIfNeeded();
    await page.screenshot({ path: OUT + `map-blur-error-1440.png` });
    const z = page.getByLabel("Zoom", { exact: true });
    await z.fill("99"); await lat.focus();
    out.zoomErr = await page.locator("#f-initialZoom-error").innerText().catch(() => null);
  }
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
