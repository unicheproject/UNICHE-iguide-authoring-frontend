import { session, go, P, ids, LOG, sleep, AE } from "./h.mjs";
import { join } from "node:path"; import { fileURLToPath } from "node:url";
const TAG = process.argv[2] ?? "after";
const OUT = join(fileURLToPath(new URL("../", import.meta.url)), TAG);
const log = LOG("panel-" + TAG);
for (const vp of ["1440", "1280", "1024", "768", "zoom200"]) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P(`/pois/${ids.poi}`)); await page.waitForSelector("#f-title, #status-card-heading");
  await page.locator("[data-preview-action]").first().click(); await sleep(900);
  const m = () => page.evaluate(() => {
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) }; };
    const btn = (n) => [...document.querySelectorAll("#editor-preview button")].find((b) => (b.textContent || "").trim().startsWith(n));
    const frame = document.querySelector("#editor-preview [data-preview-frame]");
    return { vh: innerHeight, picture: r(frame), close: r(btn("Close")), expand: r(btn("Expand") ?? btn("Collapse")), panel: r(document.querySelector("#editor-preview > *")), scrollY: Math.round((document.getElementById("main")?.scrollTop) || scrollY) };
  });
  const a = await m(); log(vp, "open", a);
  await page.screenshot({ path: join(OUT, `panel-open-${vp}.png`) });
  const ex = page.locator("#editor-preview button", { hasText: /^\s*Expand/ });
  if (await ex.count()) { await ex.first().click(); await sleep(500); const b = await m(); log(vp, "expanded", b); await page.screenshot({ path: join(OUT, `panel-expanded-${vp}.png`) }); }
  else log(vp, "no Expand button");
  log(vp, "focus", await AE(page));
  await browser.close();
}
