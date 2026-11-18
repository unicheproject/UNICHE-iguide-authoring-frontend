import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("r1");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
for (const rm of ["no-preference", "reduce"]) {
  const { browser, page } = await H.session({ reducedMotion: rm });
  try {
    const anims = () => page.evaluate(() => document.getAnimations().map(a => { const e = a.effect; const t = e?.getTiming?.(); return (a.constructor.name) + ":" + (a.transitionProperty || a.animationName || "") + ":" + (e?.target?.tagName || "") + "." + (e?.target?.className?.toString?.().slice(0, 25) || "") + " dur=" + t?.duration + " iter=" + t?.iterations + " " + a.playState; }));
    await H.go(page, H.P("/pois")); await H.sleep(300);
    // skeleton/loading: reload and sample immediately
    page.reload(); await H.sleep(250); const sk = await anims(); await H.sleep(2000);
    log(rm, "skeleton-ish anims @250ms:", sk.length, JSON.stringify(sk.slice(0, 5)));
    await page.getByRole("button", { name: "New point of interest" }).focus(); await page.keyboard.press("Enter"); await H.sleep(60);
    const d = await anims(); log(rm, "dialog opening anims @60ms:", d.length, JSON.stringify(d.slice(0, 6)));
    await H.sleep(800); await page.keyboard.press("Escape"); await H.sleep(300);
    // transitions on buttons
    log(rm, "btn transition", await page.evaluate(() => { const b = document.querySelector("main button"); const cs = getComputedStyle(b); return cs.transitionDuration + " " + cs.transitionProperty.slice(0, 40); }));
    // smooth scroll
    log(rm, "scroll-behavior", await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior));
    // toast: save POI
    await H.go(page, H.P("/pois/" + ids.poi)); await H.sleep(800);
    await page.keyboard.press("Tab");
    await page.getByLabel("Title", { exact: false }).first().focus(); await page.keyboard.type("x"); await page.keyboard.press("Control+s"); await H.sleep(120);
    const sv = await anims(); log(rm, "saving anims:", sv.length, JSON.stringify(sv.slice(0, 5)));
    await H.sleep(1500); await page.keyboard.press("Backspace"); await page.keyboard.press("Control+s"); await H.sleep(1500);
    // preview
    await H.go(page, H.P("/preview")); await H.sleep(1500); const pv = await anims(); log(rm, "preview anims:", pv.length, JSON.stringify(pv.slice(0, 5)));
    // smooth scroll via nav on this page? media tile hover
  } finally { await browser.close(); }
}
