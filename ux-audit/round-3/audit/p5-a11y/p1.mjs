import * as H from "./h.mjs";
import { readFileSync } from "node:fs";
const log = H.LOG("p1");
const ids = JSON.parse(readFileSync(H.here + "/ids.json", "utf8"));
const { browser, page } = await H.session({ forcedColors: "active" });
const boundary = () => page.evaluate(() => {
  const res = { nofm: [], total: 0 };
  const parentBg = (e) => { let p = e.parentElement; while (p) { const c = getComputedStyle(p).backgroundColor; if (c !== "rgba(0, 0, 0, 0)") return c; p = p.parentElement; } return "Canvas"; };
  for (const e of document.querySelectorAll("button,a[href],[role=tab],select,input:not([type=radio]):not([type=checkbox]):not([type=file]),textarea,summary")) {
    const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || getComputedStyle(e).visibility === "hidden") continue; if (e.closest("[inert],[aria-hidden=true]")) continue;
    const cs = getComputedStyle(e); res.total++;
    const bw = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
    const hasBorder = bw > 0 && cs.borderTopStyle !== "none" && cs.borderTopColor !== "rgba(0, 0, 0, 0)";
    const hasBg = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== parentBg(e);
    const link = e.tagName === "A" && /underline/.test(cs.textDecorationLine);
    const sel = e.getAttribute("aria-selected") === "true" || e.getAttribute("aria-current") || e.getAttribute("aria-pressed") === "true";
    if (!hasBorder && !hasBg && !link && !(e.tagName === "A" && e.closest("nav"))) res.nofm.push((e.tagName + ":" + (e.getAttribute("aria-label") || e.textContent.trim()).slice(0, 36)) + (sel ? " [selected/current]" : ""));
  }
  return res;
});
try {
  for (const [label, path] of [["dashboard", "/"], ["poi-list", "/pois"], ["poi-editor", "/pois/" + ids.poi], ["route-editor", "/routes/" + ids.route], ["category-editor", "/categories/" + ids.category], ["media", "/media"], ["preview", "/preview"]]) {
    await H.go(page, H.P(path)); await H.sleep(1200);
    await H.shot(page, `${label}__forced-colors__1440`);
    const b = await boundary(); log("FC", label, "controls", b.total, "no border/bg/underline:", b.nofm.length, JSON.stringify(b.nofm.slice(0, 14)));
    await page.evaluate(() => (document.querySelector("h1") || document.body).focus()); const l = await H.sweep(page, 4, "fc-" + label, log);
    const a = await H.AE(page); log("FC ring sample", JSON.stringify(a.outline));
  }
  // nav current item & chips
  await H.go(page, H.P("/pois")); await H.sleep(1000);
  log("FC nav current", await page.evaluate(() => { const a = document.querySelector("nav a[aria-current]"); const cs = getComputedStyle(a); return { outline: cs.outline, border: cs.border, bg: cs.backgroundColor, fw: cs.fontWeight, deco: cs.textDecorationLine }; }));
  log("FC chip sample", await page.evaluate(() => [...document.querySelectorAll("table tbody tr:first-child td span")].slice(0, 6).map(e => { const cs = getComputedStyle(e); return e.textContent.trim().slice(0, 20) + " | border " + cs.borderTopWidth + " " + cs.borderTopStyle + " | bg " + cs.backgroundColor; })));
  // dialog boundary
  await H.go(page, H.P("/pois?create=1")); await H.sleep(1200); await H.shot(page, "poi-create__forced-colors__1440");
  log("FC dialog", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const cs = getComputedStyle(d); return { border: cs.border, outline: cs.outline, shadow: cs.boxShadow }; }));
  await page.keyboard.press("Escape");
  await H.go(page, H.P("/pois")); await H.sleep(800);
  await page.getByRole("button", { name: /^Actions for/ }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(500); await H.shot(page, "poi-list__row-menu__forced-colors__1440");
  log("FC menu", await page.evaluate(() => { const d = document.querySelector("[role=menu]"); const cs = getComputedStyle(d); const it = document.querySelector("[role=menuitem][data-highlighted]") || document.activeElement; const ics = getComputedStyle(it); return { border: cs.border, itemBg: ics.backgroundColor, itemOutline: ics.outline, itemColor: ics.color }; }));
  await page.keyboard.press("Escape");
  // switcher & filters
  await page.getByRole("button", { name: /Filters and sort/ }).focus(); await page.keyboard.press("Enter"); await H.sleep(500); await H.shot(page, "poi-list__filters__forced-colors__1440");
  log("FC popover", await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const cs = getComputedStyle(d); return { border: cs.border, outline: cs.outline }; }));
} finally { await browser.close(); }
