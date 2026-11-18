import { session, go, P, LOG, sleep } from "./h.mjs";
import { join } from "node:path"; import { fileURLToPath } from "node:url";
const TAG = process.argv[2] ?? "after";
const OUT = join(fileURLToPath(new URL("../", import.meta.url)), TAG);
const log = LOG("jump-" + TAG);
for (const vp of ["1440", "1280", "1024", "768", "zoom200"]) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P("/preview")); await page.waitForSelector("[data-preview-frame]"); await sleep(1200);
  const top = () => page.evaluate(() => Math.round((document.querySelector("[data-preview-frame]")?.getBoundingClientRect().top ?? -1) + (document.getElementById("main")?.scrollTop || 0)));
  const res = {};
  for (const s of ["Web", "Mobile", "Kiosk", "Web"]) { await page.getByRole("tab", { name: s, exact: true }).first().click(); await sleep(500); res[s + (res[s] !== undefined ? "2" : "")] = await top(); }
  const vals = Object.values(res); log(vp, res, "range", Math.max(...vals) - Math.min(...vals));
  await page.screenshot({ path: join(OUT, `preview-kiosk-${vp}.png`) });
  await browser.close();
}
