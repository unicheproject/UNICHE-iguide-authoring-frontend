import { open, go, CMS } from "../../../tools/session.mjs";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const shot = (page, n) => page.screenshot({ path: join(here, "shots", n + ".png") });
const res = {};
const cs = (page, sel, props) => page.locator(sel).first().evaluate((el, props) => { const s = getComputedStyle(el); const o = {}; for (const p of props) o[p] = s[p]; const r = el.getBoundingClientRect(); o.box = [Math.round(r.width), Math.round(r.height)]; return o; }, props);
let { browser, page, context } = await open("curator", { viewport: "1440" });
// focus rings
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2000);
const ring = ["outlineStyle", "outlineWidth", "outlineColor", "outlineOffset", "boxShadow", "borderTopColor"];
res.focus = {};
await page.keyboard.press("Tab");
for (let i = 0; i < 14; i++) {
  const d = await page.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { el: e.tagName.toLowerCase() + "." + (e.className + "").split(" ").slice(0, 3).join("."), t: (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 24), ol: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor + " off " + s.outlineOffset, bs: s.boxShadow.slice(0, 60), bc: s.borderTopColor }; });
  (res.focus["pois_tab" + i] = d);
  if (i === 6) await shot(page, "pois__focus-ring-tab7__1440");
  await page.keyboard.press("Tab");
}
// search input focus
await page.locator('input[type=search], input[placeholder^="Search"]').first().focus();
res.focus.searchInput = await page.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { ol: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor, bc: s.borderTopColor, bw: s.borderTopWidth, bs: s.boxShadow }; });
await shot(page, "pois__search-focused__1440");
// popover filters
await page.getByRole("button", { name: /Filters/ }).first().click(); await page.waitForTimeout(400); await shot(page, "pois__filters-popover__1440");
res.popover = await page.evaluate(() => { const e = document.querySelector("[role=dialog],[data-radix-popper-content-wrapper] > *"); if (!e) return null; const s = getComputedStyle(e); return { r: s.borderRadius, sh: s.boxShadow, z: s.zIndex, bg: s.backgroundColor }; });
await page.keyboard.press("Escape");
// create dialog
await go(page, `/projects/${P}/places`); await page.waitForTimeout(1800);
await page.getByRole("button", { name: /new place/i }).first().click(); await page.waitForTimeout(500); await shot(page, "places__create-dialog__1440");
res.dialog = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const s = getComputedStyle(d); const h = d.querySelector("h2"); const btns = [...d.querySelectorAll("button")].map((b) => { const c = getComputedStyle(b); return { t: b.textContent.trim().slice(0, 20), cls: b.className.slice(0, 80), bg: c.backgroundColor, bgi: c.backgroundImage.slice(0, 30), r: c.borderRadius, fs: c.fontSize, tt: c.textTransform, py: c.paddingTop, px: c.paddingLeft }; }); return { r: s.borderRadius, sh: s.boxShadow, w: s.width, pad: s.padding, h2: getComputedStyle(h).fontSize, btns, inputs: [...d.querySelectorAll("input,select,textarea")].map((i) => { const c = getComputedStyle(i); return { t: i.tagName, bc: c.borderTopColor, bw: c.borderTopWidth, r: c.borderRadius, fs: c.fontSize, pad: c.padding, h: Math.round(i.getBoundingClientRect().height) }; }) }; });
// submit empty
const submit = page.locator("[role=dialog] button.dialog-primary, [role=dialog] button:has-text('Create')").first();
await submit.click().catch(() => {}); await page.waitForTimeout(400); await shot(page, "places__create-dialog-error__1440");
res.invalid = await page.evaluate(() => [...document.querySelectorAll("[role=dialog] .invalid, [role=dialog] [aria-invalid=true]")].map((e) => { const c = getComputedStyle(e); return { cls: e.className.slice(0, 60), bc: c.borderTopColor, bw: c.borderTopWidth }; }));
res.errtext = await page.evaluate(() => [...document.querySelectorAll("[role=dialog] [role=alert], [role=dialog] .text-destructive")].map((e) => { const c = getComputedStyle(e); return { t: e.textContent.trim().slice(0, 50), color: c.color, fs: c.fontSize }; }));
await page.keyboard.press("Escape");
// project switcher
await page.locator("header button[aria-controls=project-switcher-menu]").click(); await page.waitForTimeout(300); await shot(page, "chrome__project-switcher__1440");
await page.keyboard.press("Escape");
// skeleton: slow network
await page.route("**/api/v1/**", async (r) => { await new Promise((x) => setTimeout(x, 3500)); await r.continue().catch(() => {}); });
await page.goto(`${CMS}/projects/${P}/pois`); await page.waitForTimeout(1500); await shot(page, "pois__skeleton__1440");
res.skeleton = await page.evaluate(() => [...document.querySelectorAll(".animate-skeleton")].slice(0, 2).map((e) => { const c = getComputedStyle(e); return { bg: c.backgroundColor, an: c.animationName + " " + c.animationDuration, r: c.borderRadius }; }));
await page.unroute("**/api/v1/**");
// empty state / error state
await go(page, `/projects/1d6971ce-6391-4da8-848e-8d7466d25128/pois`); await page.waitForTimeout(2000); await shot(page, "empty__pois-emptyB__1440");
await page.route("**/api/v1/**/pois**", (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ title: "x", status: 503, code: "UNAVAILABLE", requestId: "r-1" }) }));
await page.goto(`${CMS}/projects/${P}/pois`); await page.waitForTimeout(2500); await shot(page, "error__pois-503__1440");
await page.unroute("**/api/v1/**/pois**");
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(1500);
// hover on row button and nav
await page.locator("button:has-text('Deactivate')").first().hover(); await page.waitForTimeout(250);
res.hoverOutline = await cs(page, "button:has-text('Deactivate')", ["backgroundColor", "color", "borderTopColor", "textDecorationLine"]);
await shot(page, "pois__hover-button__1440");
await page.locator("nav a:has-text('Routes')").first().hover(); await page.waitForTimeout(250);
res.hoverNav = await cs(page, "nav a:has-text('Routes')", ["backgroundColor", "color"]);
res.navActive = await cs(page, "nav a.router-link-active", ["backgroundColor", "color", "fontWeight", "boxShadow", "borderLeftWidth", "borderLeftColor"]);
// link style
res.link = await page.evaluate(() => { const a = document.querySelector("main a"); const s = getComputedStyle(a); return { t: a.textContent.trim().slice(0, 30), color: s.color, td: s.textDecorationLine, fw: s.fontWeight }; });
await browser.close();
// forced colors + reduced motion
({ browser, page } = await open("curator", { viewport: "1440", forcedColors: "active", reducedMotion: "reduce" }));
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2000); await shot(page, "pois__forced-colors__1440");
await go(page, `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await page.waitForTimeout(2000); await shot(page, "poi_editor__forced-colors__1440");
res.forced = await page.evaluate(() => { const chips = [...document.querySelectorAll("span")].filter((s) => /ACTIVE|PENDING/.test(s.textContent) && s.className.includes("rounded-full")).slice(0, 2).map((s) => { const c = getComputedStyle(s); return { t: s.textContent.trim(), border: c.borderTopWidth + " " + c.borderTopStyle, bg: c.backgroundColor, color: c.color }; }); const inp = document.querySelector("input[type=text], input:not([type])"); const ic = inp ? getComputedStyle(inp) : null; return { chips, input: ic && { bw: ic.borderTopWidth, bs: ic.borderTopStyle, bc: ic.borderTopColor } }; });
res.reduced = await page.evaluate(() => ({ mq: matchMedia("(prefers-reduced-motion: reduce)").matches, anims: document.getAnimations().length }));
await browser.close();
// 200% zoom
({ browser, page } = await open("curator", { viewport: "zoom200" }));
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2000); await shot(page, "pois__zoom200__zoom200");
await go(page, `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await page.waitForTimeout(2000); await shot(page, "poi_editor__zoom200__zoom200");
await browser.close();
// text-size only (root font-size 32px) at 1440: px-based sizes do not scale
({ browser, page } = await open("curator", { viewport: "1440" }));
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2000);
await page.addStyleTag({ content: "html{font-size:32px !important}" }); await page.waitForTimeout(500);
await shot(page, "pois__root-font-200pct__1440");
res.rootScale = await page.evaluate(() => { const px = {}; for (const el of document.querySelectorAll("main *")) { const d = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (d) { const f = getComputedStyle(el).fontSize; px[f] = (px[f] || 0) + 1; } } return px; });
await browser.close();
writeFileSync(join(here, "data", "states.json"), JSON.stringify(res, null, 1));
console.log("ok");
