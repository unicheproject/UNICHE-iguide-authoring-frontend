import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440", forcedColors: "active" });
const k = page.keyboard;
L.log("t34", "forced-colors matches", await page.evaluate(() => matchMedia("(forced-colors: active)").matches));
for (const [n, p] of [["poi-list", "/pois"], ["poi-editor", "/pois/35d91cba-d64a-43ce-9773-1e472226d028"], ["category-editor", "/categories/ca8a9d3c-85c8-4c3a-b522-2309120772ac"], ["dashboard", ""], ["media", "/media"], ["route-editor", "/routes/11d2dfe4-09fa-48b1-8b5b-494964cf3d52"], ["preview", "/preview"], ["event-editor", "/events/b01dc48d-a833-4dfd-af71-62f355ddb3e6"]]) {
  await L.nav(page, L.P(p), 1500);
  await L.shot(page, `${n}__forced-colors__1440`);
  const r = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll("button:not([disabled]), [role=tab], a.ui-btn, .ui-chip, [data-variant]").forEach((e) => { const r = e.getBoundingClientRect(); if (!r.width || !r.height) return; const c = getComputedStyle(e); const hasBorder = parseFloat(c.borderTopWidth) > 0 && c.borderTopStyle !== "none"; const hasOutline = c.outlineStyle !== "none" && parseFloat(c.outlineWidth) > 0; if (!hasBorder && !hasOutline && c.boxShadow === "none") bad.push((e.getAttribute("aria-label") || e.textContent).trim().slice(0, 30) + " <" + e.tagName.toLowerCase() + ">"); });
    return [...new Set(bad)].slice(0, 12);
  });
  L.log("t34", n, "controls with no border/outline in forced colors:", r);
}
// current nav item + focus ring visibility
await L.nav(page, L.P("/pois"), 800);
L.log("t34", "current nav", await page.locator("nav a[aria-current]").evaluate((e) => { const c = getComputedStyle(e); return { bw: c.borderTopWidth, bl: c.borderLeftWidth, bs: c.borderTopStyle, outline: c.outline, bg: c.backgroundColor, ariaCur: e.getAttribute("aria-current") }; }).catch((e) => "none: " + e.message.slice(0, 40)));
await page.getByRole("radio", { name: /^Not archived/ }).focus();
await L.shot(page, "poi-list__forced-colors-focus__1440");
await browser.close();
