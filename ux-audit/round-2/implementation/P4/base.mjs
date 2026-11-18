import { open, go } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const r = JSON.parse(readFileSync("records.json", "utf8"));
const tag = process.argv[2] ?? "before";
for (const vp of ["1440", "1280"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const [k, path] of [["poi", `/projects/${P}/pois/${r.poi}`], ["place", `/projects/${P}/places/${r.place}`]]) {
    await page.setViewportSize(vp === "1440" ? { width: 1440, height: 900 } : { width: 1280, height: 720 }); await go(page, path);
    await page.waitForSelector("[data-sticky-bar]", { timeout: 30000 }); await page.waitForTimeout(2500);
    const h = await page.evaluate(() => { const m = document.querySelector("main"); return [m.scrollHeight, document.documentElement.scrollHeight]; });
    await page.setViewportSize({ width: page.viewportSize().width, height: 2300 }); await page.waitForTimeout(600);
    console.log(tag, vp, k, "main scrollHeight", h[0], "doc", h[1]);
    await page.screenshot({ path: `after/${tag}-${k}-${vp}.png`, fullPage: false });
  }
  await browser.close();
}
