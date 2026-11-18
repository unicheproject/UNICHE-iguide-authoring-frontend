import { open, go, P, OUT } from "./lib.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default ?? require("@axe-core/playwright");
// h1 position
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  const y = async (path) => { await go(page, `/projects/${P.pop}${path}`); await page.waitForSelector("main h1"); await page.waitForTimeout(1200); return page.evaluate(() => Math.round(document.querySelector("main h1").getBoundingClientRect().y * 10) / 10); };
  console.log("H1 y: dashboard", await y(""), "places", await y("/places"), "pois", await y("/pois"));
  await browser.close();
}
// hit areas, coarse
{
  const { browser, page } = await open("admin", { viewport: "1024", touch: true });
  await go(page, `/projects/${P.pop}`); await page.waitForSelector("[data-testid=app-status-line]"); await page.waitForTimeout(1000);
  const r = await page.evaluate(() => {
    const out = [];
    for (const e of document.querySelectorAll("#main a, #main button, #main summary")) {
      const b = e.getBoundingClientRect(); if (b.width === 0) continue;
      const a = getComputedStyle(e, "::after");
      const aw = a.content !== "none" ? parseFloat(a.width) : 0, ah = a.content !== "none" ? parseFloat(a.height) : 0;
      const w = Math.max(b.width, aw), h = Math.max(b.height, ah);
      out.push({ t: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 24), w: Math.round(w), h: Math.round(h), rect: `${Math.round(b.width)}x${Math.round(b.height)}` });
    }
    return out;
  });
  const small = r.filter((x) => x.w < 44 || x.h < 44);
  console.log("HIT total", r.length, "under44 (rect or ::after)", small.length, JSON.stringify(small.slice(0, 12)));
  const rectSmall = r.filter((x) => parseInt(x.rect) < 44 || parseInt(x.rect.split("x")[1]) < 44).length;
  console.log("HIT under44 by rect only", rectSmall);
  await browser.close();
}
// forced colours + axe at 1440, 1024
for (const [name, id] of [["pop", P.pop], ["trail", P.trail]]) {
  const { browser, page } = await open("admin", { viewport: "1280", forcedColors: "active" });
  await go(page, `/projects/${id}`); await page.waitForSelector("main h1"); await page.waitForTimeout(1500);
  const cur = await page.evaluate(() => { const c = document.querySelector("[data-state=next] span[aria-hidden]"); if (!c) return null; const s = getComputedStyle(c); return { bg: s.backgroundColor, color: s.color, border: s.borderTopWidth + " " + s.borderTopColor, text: c.textContent.trim() }; });
  console.log("FORCED", name, JSON.stringify(cur));
  await page.screenshot({ path: `${OUT}${name}-forced-1280.png` });
  await browser.close();
}
for (const vp of ["1440", "1024", "768", "zoom200"]) for (const [name, id] of [["pop", P.pop], ["trail", P.trail], ["emptyB", P.emptyB]]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${id}`); await page.waitForSelector("main h1"); await page.waitForTimeout(1500);
  const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  console.log("AXE", vp, name, res.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`).join(",") || "none");
  await page.screenshot({ path: `${OUT}${name}-${vp}.png`, fullPage: true });
  await browser.close();
}
