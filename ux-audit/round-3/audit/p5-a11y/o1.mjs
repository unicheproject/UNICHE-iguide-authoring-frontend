import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("o1");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
const seed = JSON.parse(readFileSync(H.here + "/../../../tools/seed.json", "utf8"));
const { browser, page } = await H.session({ viewport: "zoom200" });
try {
  for (const [label, path] of [["poi-list", "/pois"], ["poi-editor", "/pois/" + ids.poi], ["poi-editor-active", "/pois/" + seed.pois[0].id], ["route-editor", "/routes/" + ids.route], ["media", "/media"], ["dashboard", "/"], ["preview", "/preview"]]) {
    await H.go(page, H.P(path)); await H.sleep(1200);
    await H.shot(page, `${label}__top__zoom200`);
    const s = await H.stickyStack(page, 800); log("STICKY", label, JSON.stringify({ pct: s.pct, covered: s.covered, vh: s.vh, items: s.items.map(i => `${i.tag}@${i.top}+${i.h}`) }));
    await H.shot(page, `${label}__scrolled__zoom200`);
    log("hscroll", label, await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })));
    await H.axe(page, label + "@zoom200", log);
    // focus-obscured sweep: tab 25 stops
    await page.evaluate(() => { (document.querySelector("h1") || document.body).focus(); }); await H.sweep(page, 25, label + "@zoom200", log);
  }
} finally { await browser.close(); }
