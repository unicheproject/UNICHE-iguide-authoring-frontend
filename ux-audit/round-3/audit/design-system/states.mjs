import { open, go } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5"; const base = `/projects/${P}`;
const { browser, page } = await open("admin", { viewport: "1440" });
const out = {};
const styleOf = (loc, props) => loc.evaluate((el, props) => { const cs = getComputedStyle(el); const o = {}; for (const p of props) o[p] = cs[p]; const r = el.getBoundingClientRect(); o.rect = [r.x, r.y, r.width, r.height].map((v) => +v.toFixed(1)); return o; }, props);
const FP = ["backgroundColor","color","borderTopColor","outlineStyle","outlineWidth","outlineOffset","outlineColor","boxShadow","opacity","cursor","fontSize","fontWeight","borderRadius"];
// 1. button states on places list
await go(page, `${base}/places`); await page.waitForTimeout(1800);
const btns = {
  primary: page.getByRole("button", { name: /^New place/i }).first(),
  secondary: page.locator("main button[data-variant=secondary]").first(),
};
for (const [n, loc] of Object.entries(btns)) { if (!(await loc.count())) { out["btn_" + n] = "missing"; continue; }
  const s = {}; s.rest = await styleOf(loc, FP); await loc.hover(); s.hover = await styleOf(loc, FP);
  await page.mouse.down(); s.active = await styleOf(loc, FP); await page.mouse.move(5, 5); await page.mouse.up(); await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  await loc.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab"); s.focus = await styleOf(loc, FP);
  await page.screenshot({ path: `shots/places__btn-${n}-focus__1440.png`, clip: { x: s.focus.rect[0]-20, y: s.focus.rect[1]-20, width: s.focus.rect[2]+40, height: s.focus.rect[3]+40 } });
  out["btn_" + n] = s; }
// 2. row menu: open first row menu, keyboard highlight
try {
  const trigger = page.locator("tbody tr").first().getByRole("button", { name: /actions|menu|more/i }).first();
  await trigger.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
  await page.keyboard.press("ArrowDown"); await page.waitForTimeout(200);
  const menu = page.locator('[role=menu]').first();
  const hi = page.locator('[role=menu] [data-highlighted]').first();
  out.rowMenu = { menu: await styleOf(menu, ["backgroundColor","boxShadow","borderTopColor","borderTopWidth","borderRadius","zIndex"]), hi: await styleOf(hi, [...FP, "paddingTop","paddingLeft"]), items: await page.locator('[role=menu] [role^=menuitem]').count() };
  await page.screenshot({ path: "shots/places__rowmenu-open__1440.png" });
  await page.keyboard.press("Escape");
} catch (e) { out.rowMenu = String(e).slice(0, 200); }
// 3. create dialog
try { await go(page, `${base}/places?create=1`); await page.waitForTimeout(1500);
  const dlg = page.locator('[role=dialog]').first();
  out.dialog = { panel: await styleOf(dlg, ["backgroundColor","boxShadow","borderRadius","borderTopWidth","borderTopColor","animationName","animationDuration","maxWidth"]),
    close: await styleOf(dlg.getByRole("button", { name: /close/i }), FP), heading: await styleOf(dlg.locator("h2"), ["fontSize","fontWeight","paddingTop","lineHeight"]),
    overlayZ: await page.evaluate(() => getComputedStyle(document.querySelector('[role=dialog]').parentElement).zIndex), footer: await dlg.locator("footer").first().evaluate((e)=>({pad:getComputedStyle(e).padding,top:getComputedStyle(e).borderTopWidth})) .catch(()=>null), focusedTag: await page.evaluate(() => document.activeElement?.tagName + ":" + (document.activeElement?.getAttribute("aria-label")||document.activeElement?.id)) };
  await page.screenshot({ path: "shots/places__create-dialog__1440.png" });
  const closeLoc = dlg.getByRole("button", { name: /close/i }); await closeLoc.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  out.dialog.closeFocus = await styleOf(closeLoc, FP);
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
} catch (e) { out.dialog = String(e).slice(0, 200); }
// 4. place editor: language tabs focus, helphint, side cards
try { await go(page, `${base}/places`); await page.waitForTimeout(1500);
  const href = await page.evaluate(() => [...document.querySelectorAll('a[href*="/places/"]')].find((a) => /\/places\/[0-9a-f-]{36}/.test(a.getAttribute("href")) && !/UX-R/.test(a.textContent))?.getAttribute("href"));
  await go(page, href); await page.waitForTimeout(2500);
  const tabs = page.locator('[role=tab]'); out.tabCount = await tabs.count();
  if (out.tabCount) { const t = tabs.first(); await t.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
    out.tabFocus = await styleOf(t, FP); const tl = page.locator('[role=tablist]').first();
    out.tablist = await tl.evaluate((e) => { const cs=getComputedStyle(e); let clip=null; for (let p=e; p; p=p.parentElement) { const c=getComputedStyle(p); if (/(hidden|auto|scroll)/.test(c.overflowX+c.overflowY)) { clip={tag:p.tagName+"."+(p.className+"").slice(0,50), ox:c.overflowX, oy:c.overflowY, r:p.getBoundingClientRect().toJSON()}; break; } } return { overflowX: cs.overflowX, overflowY: cs.overflowY, rect: e.getBoundingClientRect().toJSON(), clip, tabRect: e.querySelector("[role=tab]").getBoundingClientRect().toJSON() }; });
    const r = out.tabFocus.rect; await page.screenshot({ path: "shots/placeEditor__tab-focus__1440.png", clip: { x: Math.max(0,r[0]-30), y: r[1]-30, width: r[2]+200, height: r[3]+60 } }); }
  // help hints
  out.help = await page.evaluate(() => [...document.querySelectorAll('button[aria-label]')].filter((b) => /what is|help/i.test(b.getAttribute("aria-label"))).map((b) => { const r=b.getBoundingClientRect(); return { l:b.getAttribute("aria-label"), w:r.width, h:r.height }; }));
  // cards: headings and paddings
  out.cards = await page.evaluate(() => [...document.querySelectorAll("section, aside > div, [class*=rounded-lg][class*=border]")].filter((e) => e.querySelector("h2,h3") && e.getBoundingClientRect().width > 200 && e.getBoundingClientRect().width < 700).slice(0, 14).map((e) => { const h = e.querySelector("h2,h3"); const cs=getComputedStyle(e); const hs=getComputedStyle(h); return { h: h.textContent.trim().slice(0,28), tag:h.tagName, hs: hs.fontSize+"/"+hs.fontWeight, pad: cs.padding, radius: cs.borderRadius, shadow: cs.boxShadow==="none"?"none":"yes", w: Math.round(e.getBoundingClientRect().width), cls:(e.className+"").slice(0,60) }; }));
  // primary focus ring in editor header
  await page.screenshot({ path: "shots/placeEditor__top__1440.png", clip: { x: 232, y: 56, width: 1208, height: 170 } });
  // keyboard tour: record focus style of first 45 tab stops
  await page.evaluate(() => document.activeElement?.blur()); await page.mouse.click(700, 5);
  const stops = [];
  for (let i = 0; i < 45; i++) { await page.keyboard.press("Tab"); const s = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { tag: e.tagName.toLowerCase() + (e.getAttribute("role") ? "[" + e.getAttribute("role") + "]" : "") + (e.getAttribute("data-variant") ? "{" + e.getAttribute("data-variant") + "}" : ""), name: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 22), outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor + " off " + cs.outlineOffset, shadow: cs.boxShadow.replace(/rgba?\(([^)]*)\)/g, "rgba($1)"), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor }; }); stops.push(s); }
  out.stops = stops;
} catch (e) { out.editorErr = String(e).slice(0, 300); }
// 5. toast: trigger an error toast via failing route? use a harmless 5xx on save? skip; read static
writeFileSync("states.json", JSON.stringify(out, null, 1));
await browser.close(); console.log("ok");
