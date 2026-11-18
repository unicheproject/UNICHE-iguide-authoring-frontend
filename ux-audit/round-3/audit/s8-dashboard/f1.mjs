import { open, go, shot, settle, dash, T, P, SH } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, dash(P)); await settle(page, 2000);
// focus Preview the app button in status card, clip screenshot
for (const [name, loc] of [["preview-btn", page.getByRole("link", { name: "Preview the app" }).first()], ["about-launch", page.getByRole("link", { name: "About Launch" })], ["review-warnings", page.getByRole("button", { name: "Review warnings" })]]) {
  await loc.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  const info = await loc.evaluate(e => { const c = getComputedStyle(e), b = e.getBoundingClientRect(); return { outline: c.outline, off: c.outlineOffset, shadow: c.boxShadow.slice(0,80), bg: c.backgroundColor, color: c.color, fw: c.fontWeight, deco: c.textDecorationLine, h: Math.round(b.height), w: Math.round(b.width), padding: c.padding, radius: c.borderRadius }; });
  console.log(name, JSON.stringify(info));
  await page.screenshot({ path: SH + `status-focus-${name}__1440.png`, clip: { x: 256, y: 270, width: 520, height: 80 } });
  await loc.hover(); const hv = await loc.evaluate(e => { const c = getComputedStyle(e); return c.backgroundColor + " " + c.textDecorationLine + " " + c.color; }); console.log(name, "hover", hv);
}
await go(page, dash(T)); await settle(page, 1500);
for (const [name, loc] of [["show-drafts", page.getByRole("link", { name: "Show drafts" })], ["open-pages", page.getByRole("link", { name: "Open Pages" })], ["dismiss", page.getByRole("button", { name: "Dismiss guide" })]]) {
  await loc.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  const b = await loc.boundingBox();
  await page.screenshot({ path: SH + `guide-focus-${name}__1440.png`, clip: { x: Math.max(0,b.x - 20), y: Math.max(0,b.y - 20), width: b.width + 40, height: b.height + 40 } });
  console.log(name, await loc.evaluate(e => { const c = getComputedStyle(e); return c.outline + " off " + c.outlineOffset + " | " + c.boxShadow.slice(0,60); }));
}
await browser.close();
