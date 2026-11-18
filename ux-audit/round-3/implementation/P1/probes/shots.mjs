import { createRequire } from "node:module";
import { open, go } from "../../../../tools/session.mjs";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default;
const OUT = "ux-audit/round-3/implementation/P1/after/";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const res = {};
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, context, page } = await open("admin", { viewport: vp });
  for (const [n, path] of [["home", "/"], ["pois", `/projects/${P}/pois`], ["notfound", `/projects/${P}/zzz`]]) {
    await go(page, path); await page.waitForTimeout(3500);
    await page.screenshot({ path: OUT + `${n}-${vp}.png` });
    if (vp === "1440") { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze(); res["axe-" + n] = r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => v.id); }
  }
  // 503 on the project read
  await context.route(new RegExp(`/projects/${P}$`), (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ status: 503, code: "PLATFORM_UNAVAILABLE", requestId: "req-p1-503" }) }));
  await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1500);
  res["503-" + vp] = await page.evaluate(() => document.querySelector("main")?.innerText.replace(/\s+/g, " ").slice(0, 260));
  await page.screenshot({ path: OUT + `project-503-${vp}.png` });
  await browser.close();
}
// forced colours home + keyboard focus on logo
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, "/"); await page.waitForTimeout(3000); await page.screenshot({ path: OUT + "home-forced-1440.png" });
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, "/"); await page.waitForTimeout(2000);
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  res.focus2 = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent.trim().slice(0, 30));
  await page.screenshot({ path: OUT + "logo-focus-1440.png", clip: { x: 0, y: 0, width: 700, height: 70 } });
  await browser.close();
}
console.log(JSON.stringify(res, null, 1));
