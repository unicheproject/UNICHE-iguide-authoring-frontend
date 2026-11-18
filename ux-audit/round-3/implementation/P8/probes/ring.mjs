import { session, go, P, LOG, sleep } from "./h.mjs";
import { join } from "node:path"; import { fileURLToPath } from "node:url";
const OUT = join(fileURLToPath(new URL("../", import.meta.url)), "after");
const log = LOG("ring");
const { browser, page } = await session({ viewport: "1440" });
await go(page, P("/preview")); await page.waitForSelector("[data-preview-frame]"); await sleep(1000);
await page.getByRole("button", { name: /Interact/ }).click();
for (let i = 0; i < 6; i++) { await page.keyboard.press("Tab"); const r = await page.evaluate(() => { const a = document.activeElement; if (!a?.closest(".stand-in-header")) return null; const cs = getComputedStyle(a); return { outline: cs.outlineColor + " " + cs.outlineWidth + " " + cs.outlineStyle, bg: getComputedStyle(a.closest(".stand-in-header")).backgroundColor }; }); if (r) { const L = (c) => { const m = c.match(/\d+/g).map(Number).map((v) => { v/=255; return v<=.03928? v/12.92 : ((v+.055)/1.055)**2.4; }); return .2126*m[0]+.7152*m[1]+.0722*m[2]; }; const a = L(r.outline), b = L(r.bg); r.contrast = +((Math.max(a,b)+.05)/(Math.min(a,b)+.05)).toFixed(2); log("ring", r); await page.screenshot({ path: join(OUT, "stand-in-ring-1440.png"), clip: { x: 250, y: 380, width: 1180, height: 260 } }); break; } }
await browser.close();
