import { open, go, P, shot, settle, SH } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await settle(page, 2000);
const b = page.getByRole("button", { name: "New point of interest" });
await b.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
const m = await b.evaluate(e => { const cs = getComputedStyle(e); return { fv: e.matches(":focus-visible"), ow: cs.outlineWidth, oc: cs.outlineColor, oo: cs.outlineOffset, sh: cs.boxShadow, bg: cs.backgroundColor }; });
console.log(JSON.stringify(m));
await page.screenshot({ path: SH + "focus__primary-new-poi__1440.png", clip: { x: 1100, y: 56, width: 340, height: 100 } });
// zoomed crop
await page.screenshot({ path: SH + "focus__primary-new-poi-wide__1440.png", clip: { x: 900, y: 40, width: 540, height: 130 } });
await browser.close();
