import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
const R = "11d2dfe4-09fa-48b1-8b5b-494964cf3d52";
await L.nav(page, L.P("/routes/" + R), 1800);
await L.watchLive(page);
const h = page.getByRole("button", { name: /^Drag handle for stop 3,/ });
await h.focus(); await k.press("ArrowDown"); await page.waitForTimeout(1200);
L.log("t21", "after move, focus (1.2s later)", await L.focus(page));
await page.getByRole("button", { name: /^Remove stop 1,/ }).focus(); await k.press("Enter"); await page.waitForTimeout(600);
const undo = page.getByRole("button", { name: /undo/i }).first();
L.log("t21", "undo y/visible", await undo.evaluate((e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), vh: innerHeight }; }), "focus", await L.focus(page));
await L.shot(page, "route__undo-offscreen__1440");
// Tab until undo
let n = 0; for (; n < 60; n++) { await k.press("Tab"); const f = await L.focus(page); if (/Undo/i.test(f)) { L.log("t21", "Tabs to Undo from remove focus:", n + 1, f); break; } }
await k.press("Control+z"); await page.waitForTimeout(300);
L.log("t21", "Ctrl+Z restores?", await page.getByRole("link", { name: /^Stop \d/ }).count());
await browser.close();
