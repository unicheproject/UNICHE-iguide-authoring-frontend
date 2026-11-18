import { session, go, P, ids, LOG, shot, sleep, AFTER } from "./h.mjs";
import { join } from "node:path";
const vps = (process.argv[2] ?? "1440,768").split(",");
for (const vp of vps) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P(`/routes/${ids.route}`));
  await page.waitForSelector(".leaflet-marker-icon", { timeout: 25000 }); await sleep(1500);
  await page.evaluate(() => document.getElementById("stops").scrollIntoView({ block: "start" })); await sleep(600);
  await page.screenshot({ path: join(AFTER, `route-stops-${vp}.png`) });
  await page.mouse.wheel(0, 520); await sleep(600);
  await page.screenshot({ path: join(AFTER, `route-stops2-${vp}.png`) });
  await browser.close();
}
