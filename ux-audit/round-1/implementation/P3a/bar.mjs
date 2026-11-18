import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
for (const [vp, w] of [["1440", 1440], ["1280", 1280], ["1024", 1024]]) {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await page.setViewportSize({ width: w, height: 900 });
  for (const k of ["pois", "routes", "guides", "events", "categories"]) {
    await go(page, `/projects/${P}/${k}`); await page.waitForTimeout(3500);
    const s = page.getByRole("search"); const h = (await s.count()) ? await s.first().evaluate((e) => Math.round(e.getBoundingClientRect().height)) : "n/a";
    console.log(k, w, "toolbar height", h);
    if (["pois", "routes"].includes(k) || w === 1280) await page.screenshot({ path: `${out}bar-${k}__${vp}.png`, clip: { x: 0, y: 0, width: w, height: 420 } });
  }
  await browser.close();
}
