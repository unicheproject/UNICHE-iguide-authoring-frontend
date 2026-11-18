import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("s2");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
const seed = JSON.parse(readFileSync(H.here + "/../../../tools/seed.json", "utf8"));
for (const vp of ["1440", "1280", "1024", "zoom200"]) {
  const { browser, page } = await H.session({ viewport: vp });
  try {
    for (const [label, path] of [["poi-list", "/pois"], ["poi-editor", "/pois/" + ids.poi], ["poi-editor-active", "/pois/" + seed.pois[0].id], ["route-editor", "/routes/" + ids.route], ["media", "/media"]]) {
      await H.go(page, H.P(path)); await H.sleep(900);
      const s = await H.stickyStack(page, 1200);
      log("STICKY", vp, label, `total ${s.pct}% (${s.covered}/${s.vh}px) below app header ${s.belowAppPct}% scrollTop=${s.scrolled}`, JSON.stringify(s.items.map(i => `${i.tag}@${i.top}+${i.h}`)));
      if (label === "poi-list" || label === "poi-editor-active") await H.shot(page, `${label}__sticky-scrolled__${vp}`);
    }
  } finally { await browser.close(); }
}
