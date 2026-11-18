import * as H from "./h.mjs";
const log = H.LOG("w1");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/pois")); await H.sleep(900);
  await page.getByRole("button", { name: /^Actions for/ }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(400);
  log("menu highlight", await page.evaluate(() => { const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); const p = m[1].split(/[ ,\/]+/).map(Number); return { r: p[0], g: p[1], b: p[2] }; }; const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }; const a = document.activeElement; const menu = a.closest("[role=menu]"); const hb = getComputedStyle(a).backgroundColor, mb = getComputedStyle(menu).backgroundColor; const l1 = lum(parse(hb)), l2 = lum(parse(mb)); return { highlightBg: hb, menuBg: mb, ratio: +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2), outline: getComputedStyle(a).outlineStyle }; }));
  await page.keyboard.press("Escape");
  // HelpHint size
  await H.go(page, H.P("/")); await H.sleep(800);
  log("helphint", await page.evaluate(() => [...document.querySelectorAll("button[aria-label*='What'],button[aria-label*='Why']")].map(b => { const r = b.getBoundingClientRect(); return b.getAttribute("aria-label").slice(0, 40) + " " + Math.round(r.width) + "x" + Math.round(r.height); })));
  // dashboard primary ring bg
  await page.getByRole("link", { name: "Preview the app" }).focus(); log("preview the app ring", JSON.stringify(await H.chk(page)));
} finally { await browser.close(); }
