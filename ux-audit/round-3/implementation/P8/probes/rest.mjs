import { session, go, P, ids, LOG, sleep, AE } from "./h.mjs";
import { join } from "node:path"; import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../../package.json", import.meta.url));
const AxeBuilder = require("@axe-core/playwright").default;
const OUT = join(fileURLToPath(new URL("../", import.meta.url)), "after");
const log = LOG("rest");
const ax = async (page, n) => log("axe", n, (await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze()).violations.map(v=>v.id+":"+v.impact+":"+v.nodes.length));
for (const vp of ["1440","1024","768","zoom200"]) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P("/preview")); await page.waitForSelector("[data-preview-frame]"); await sleep(1000);
  if (vp === "1440") {
    await page.getByRole("button", { name: /Interact/ }).click(); await sleep(300);
    // focus a header button inside the stand-in
    const r = await page.evaluate(() => { const b = document.querySelector("[data-preview-frame] .stand-in-header button"); b.focus(); const cs = getComputedStyle(b); return { outline: cs.outlineColor + " " + cs.outlineWidth + " " + cs.outlineStyle, bg: getComputedStyle(b.closest(".stand-in-header")).backgroundColor }; });
    log("ring", r); await page.screenshot({ path: join(OUT, "stand-in-ring-1440.png"), clip: { x: 250, y: 380, width: 1180, height: 200 } });
    // hint popover
    await page.getByRole("button", { name: "What does Fire a trigger do?" }).click(); await sleep(300); await page.screenshot({ path: join(OUT, "hint-fire-1440.png") }); await page.keyboard.press("Escape");
  }
  await page.screenshot({ path: join(OUT, `preview-${vp}.png`) });
  await ax(page, "preview-" + vp);
  await browser.close();
}
// empty project states
{ const { browser, page } = await session({ viewport: "1440" });
  await page.route(/\/(places|pois|routes|guides|events)(\?|$)/, async (route) => { const u = route.request().url(); if (!/\/projects\/[^/]+\/(places|pois|routes|guides|events)(\?|$)/.test(u) || route.request().method() !== "GET") return route.continue(); await route.fulfill({ contentType: "application/json", json: { content: [], number: 0, size: 100, totalElements: 0, totalPages: 0, first: true, last: true, numberOfElements: 0 } }); });
  await go(page, P("/preview")); await sleep(2000); await page.screenshot({ path: join(OUT, "preview-empty-1440.png") });
  log("empty section", await page.locator("#preview-empty").count());
  await go(page, P("/app-preview")); await sleep(2000); await page.screenshot({ path: join(OUT, "newtab-empty-1440.png") }); log("empty newtab", await page.locator("#np-empty").count());
  await ax(page, "newtab-empty");
  await browser.close(); }
// editor panel axe + keyboard + forced colours
for (const vp of ["1440","1024","768","zoom200"]) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P(`/pois/${ids.poi}`)); await page.waitForSelector("#f-title");
  const btn = page.locator("[data-preview-action]").first(); await btn.focus(); await page.keyboard.press("Enter"); await sleep(900);
  log("kb open focus", vp, await AE(page));
  await page.screenshot({ path: join(OUT, `editor-panel-${vp}.png`) });
  await ax(page, "editor-panel-" + vp);
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); log("tab x2", await AE(page));
  await page.keyboard.press("Escape"); await sleep(300); log("esc ->", await AE(page));
  await browser.close();
}
{ const { browser, page } = await session({ viewport: "1440", forcedColors: "active" });
  await go(page, P(`/pois/${ids.poi}`)); await page.waitForSelector("#f-title"); await page.locator("[data-preview-action]").first().click(); await sleep(900);
  await page.screenshot({ path: join(OUT, "forced-colours-panel-1440.png") }); await browser.close(); }
