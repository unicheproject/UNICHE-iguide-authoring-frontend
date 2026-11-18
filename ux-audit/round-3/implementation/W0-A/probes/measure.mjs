// W0-A acceptance probe (account admin). Prints one JSON object of measurements; screenshots go to ../after/.
import { open, go } from "../../../../tools/session.mjs";
import { serveDist } from "./dist.mjs";
const DIST = !!process.env.DIST;
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const OUT = "ux-audit/round-3/implementation/W0-A/after/" + (DIST ? "dist-" : "");
const EV = "6e8462e3-a8b5-4f4b-a625-6140c1fd117e";
const res = {};
const lum = ([r, g, b]) => { const c = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x); return +((l1 + 0.05) / (l2 + 0.05)).toFixed(2); };
const rgb = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const { browser, context, page } = await open("admin");
if (DIST) await serveDist(context);
process.on("uncaughtException", (e) => { console.log(JSON.stringify(res, null, 1)); console.log("FAILED", e.message.split("\n")[0]); process.exit(1); });

const focusInfo = () => page.evaluate(() => {
  const el = document.activeElement; const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
  return { tag: el.tagName, label: el.getAttribute("aria-label") || el.textContent.trim().slice(0, 30), outlineColor: cs.outlineColor, outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineOffset: cs.outlineOffset, boxShadow: cs.boxShadow, bg: cs.backgroundColor, rect: { x: r.x, y: r.y, w: r.width, h: r.height } };
});

await page.addInitScript(() => { window.toastModule = () => import(performance.getEntriesByType("resource").map((e) => e.name).find((n) => /\/src\/stores\/toast\.ts/.test(n)) ?? "/src/stores/toast.ts"); });
// A1: primary button focus, canvas and dialog
await go(page, `/projects/${P}/pois`);
await page.waitForSelector("tbody tr");
const primary = page.locator("main [data-variant=primary]").first();
res.primaryLabel = await primary.textContent();
await page.keyboard.press("Tab"); // ensure keyboard modality
await primary.focus();
await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
let f = await focusInfo();
res.canvasPrimary = { ...f, ringVsCanvas: ratio(rgb(f.outlineColor), [244, 245, 247]), ringVsFill: ratio(rgb(f.outlineColor), rgb(f.bg)) };
await page.screenshot({ path: OUT + "primary-focus-canvas__1440.png", clip: { x: 0, y: 0, width: 1440, height: 300 } });
await primary.click();
await page.waitForSelector("[role=dialog]");
await page.waitForTimeout(400);
// Tab order: Close first
const dlgFirst = async () => {
  await page.evaluate(() => document.querySelector("[role=dialog]").focus());
  await page.keyboard.press("Tab");
  return page.evaluate(() => document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.trim().slice(0, 20));
};
res.dialogFirstTab_poi = await dlgFirst();
// primary in dialog
const dlgPrimary = page.locator("[role=dialog] [data-variant=primary]").first();
await page.locator("[role=dialog] input").first().fill("UX-R3-W0A probe");
await dlgPrimary.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
f = await focusInfo();
res.dialogPrimary = { ...f, ringVsSurface: ratio(rgb(f.outlineColor), [255, 255, 255]) };
await page.screenshot({ path: OUT + "dialog-primary-focus__1440.png" });
// panel top before/after summary
await page.locator("[role=dialog] input").first().fill("");
const top0 = await page.evaluate(() => document.querySelector("[role=dialog]").getBoundingClientRect().top);
await dlgPrimary.click(); await page.waitForTimeout(500);
const top1 = await page.evaluate(() => document.querySelector("[role=dialog]").getBoundingClientRect().top);
res.dialogTopJump = { before: top0, after: top1 };
res.alertsInDialog = await page.evaluate(() => document.querySelectorAll("[role=dialog] [role=alert]").length);
await page.screenshot({ path: OUT + "dialog-summary__1440.png" });
// pressed: primary bg hover vs active
const bgOf = (loc) => loc.evaluate((e) => getComputedStyle(e).backgroundColor);
async function pressed(loc, name) {
  const box = await loc.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(250);
  const hover = await bgOf(loc);
  await page.mouse.down(); await page.waitForTimeout(250);
  const active = await bgOf(loc);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - box.height); if (name === "primary" || name === "secondary") { const h = await page.locator("[role=dialog] h2").boundingBox(); await page.mouse.move(h.x + 4, h.y + 4); } await page.mouse.up();
  await page.waitForTimeout(250);
  res.pressed = { ...(res.pressed ?? {}), [name]: { hover, active, differs: hover !== active } };
}
await page.locator("[role=dialog] input").first().fill("x");
await pressed(dlgPrimary, "primary");
await pressed(page.getByRole("button", { name: "Cancel" }), "secondary");
// dialog z: HelpHint? close dialog
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
const disc = page.getByRole("button", { name: /^Discard$/ });
if (await disc.count()) await disc.click();
await page.waitForTimeout(400);
// ghost kebab + menu highlight
const kebab = page.locator("tbody tr").first().locator("button[aria-label^=Actions]");
await pressed(kebab, "ghost");
await kebab.focus(); await page.keyboard.press("Enter");
await page.waitForSelector("[role=menu]");
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(200);
res.menuHighlight = await page.evaluate(() => { const h = document.querySelector("[role=menu] [data-highlighted]"); const cs = getComputedStyle(h); return { bg: cs.backgroundColor, outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, outlineOffset: cs.outlineOffset, menuBg: getComputedStyle(h.parentElement).backgroundColor }; });
res.menuHighlight.fillVsMenu = ratio(rgb(res.menuHighlight.bg), rgb(res.menuHighlight.menuBg));
await page.screenshot({ path: OUT + "menu-open__1440.png", clip: { x: 700, y: 150, width: 740, height: 520 } });
await page.keyboard.press("Escape");

// A1 tab strip clipping
await go(page, `/projects/${P}/maps`);
await page.waitForSelector("nav[aria-label] a.ui-tab");
const tab = page.locator("nav[aria-label] a.ui-tab").nth(1);
await tab.focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
res.tabStrip = await page.evaluate(() => {
  const el = document.activeElement; const nav = el.closest("nav"); const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect(); const n = nav.getBoundingClientRect();
  const off = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth);
  const ring = { l: r.left - off, t: r.top - off, r: r.right + off, b: r.bottom + off };
  const clip = { left: n.left + nav.clientLeft, top: n.top + nav.clientTop, right: n.right - 0, bottom: n.bottom };
  return { outline: cs.outlineStyle + " " + cs.outlineWidth + " " + cs.outlineColor, ring, scroller: clip, clippedSides: [ring.l < clip.left, ring.t < clip.top, ring.r > clip.right, ring.b > clip.bottom].filter(Boolean).length };
});
await page.screenshot({ path: OUT + "linktabs-focus__1440.png", clip: { x: 230, y: 0, width: 900, height: 260 } });

// heading focus after route change
await page.getByRole("link", { name: "Places", exact: true }).first().click();
await page.waitForTimeout(1200);
res.headingFocus = await page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { tag: el.tagName, outlineStyle: cs.outlineStyle }; });

if (!DIST) {
// Toasts: inject via the app's own module instance
await go(page, `/projects/${P}/pois`);
async function poiEditor() {
  await page.locator("tbody tr").first().locator("a").first().click();
  await page.waitForSelector("#editor-side-column", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
}
await poiEditor();
res.sideColumnPresent = await page.evaluate(() => !!document.getElementById("editor-side-column"));
res.toast = {};
for (const w of [1440, 1280, 1024]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(400);
  await page.evaluate(async () => { const m = await toastModule(); m.showToast("Changes discarded", "The POI is as visitors see it.", "warning"); m.showToast("Link copied", "https://example.org/x", "success"); });
  await page.waitForTimeout(600);
  res.toast[w] = await page.evaluate(() => {
    const box = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
    const toasts = [...document.querySelectorAll("[data-toast]")];
    const form = document.querySelector("main form") ?? document.querySelector("main [id^=section], main");
    const side = document.getElementById("editor-side-column");
    const fb = form.getBoundingClientRect();
    const formCol = document.querySelector("main form"); const fbox = formCol ? formCol.getBoundingClientRect() : fb;
    const out = toasts.map((t) => ({ title: t.querySelector("strong").textContent.trim(), h: Math.round(t.getBoundingClientRect().height), iconIsCheck: !!t.querySelector("svg.lucide-circle-check"), iconTriangle: !!t.querySelector("svg.lucide-triangle-alert"), box: box(t), overlapsFormColumn: side && side.getBoundingClientRect().top < 400 ? t.getBoundingClientRect().left < side.getBoundingClientRect().left - 1 : "stacked" }));
    return { toasts: out, form: box(formCol ?? form), side: side ? box(side) : null };
  });
  await page.screenshot({ path: OUT + `toast-poi-editor__${w}.png` });
  await page.evaluate(async () => { const m = await toastModule(); while (m.toastState.items.length) m.dismissToast(); });
}
await page.setViewportSize({ width: 1440, height: 900 });
// toast dismiss focus
await page.evaluate(async () => { const m = await toastModule(); m.showToast("One", "", "success", { persist: true }); m.showToast("Two", "", "success", { persist: true }); });
await page.waitForTimeout(300);
await page.locator("[data-toast] button[aria-label='Dismiss notification']").first().focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(300);
res.toastDismissFocus = await page.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, label: a.getAttribute("aria-label") }; });
await page.keyboard.press("Enter"); await page.waitForTimeout(300);
res.toastDismissFocusLast = await page.evaluate(() => { const a = document.activeElement; return { tag: a.tagName, text: a.textContent.trim().slice(0, 30) }; });
// route-change clears
await page.evaluate(async () => { const m = await toastModule(); m.showToast("Stale", "", "success", { persist: true }); });
await page.waitForTimeout(1800);
await go(page, `/projects/${P}/places`).catch(() => {});

// Format, glossary
res.format = await page.evaluate(async () => { const f = await import("/src/lib/format.ts"); const g = await import("/src/lib/glossary.ts"); return { bytes: JSON.stringify(f.formatBytes(163000)), hasNbsp: f.formatBytes(163000).includes("\u00A0"), dist: JSON.stringify(f.formatDistance(1400)), keys: ["previewContent", "fireTrigger", "previewSurface", "launchPlaceholder", "readinessChecksOnActivation", "translationsWorklist", "bounds", "visitorFilter"].map((k) => [k, k in g.glossary]) }; });
res.routerParse = await page.evaluate(async () => { const r = await import("/src/router.ts"); return r.parseAppPreviewQuery({ orientation: "landscape", real: "1", surface: "KIOSK", lang: "el", evil: "x", t: ["abc"] }); });
res.routerParseBad = await page.evaluate(async () => { const r = await import("/src/router.ts"); return r.parseAppPreviewQuery({ orientation: "<script>", real: "maybe" }); });
res.stale = await page.evaluate(async () => { const m = await toastModule(); return m.toastState.items.map((t) => t.title); });

}
// A5 DateTimeFields in Event editor
await go(page, `/projects/${P}/events/${EV}`);
await page.waitForSelector("fieldset");
await page.waitForTimeout(1000);
const fs = page.locator("fieldset").filter({ has: page.locator("input[id$=-hour]") }).first();
const startVal = async () => page.evaluate(() => [...document.querySelectorAll("input[id$=-day],input[id$=-year],input[id$=-hour],input[id$=-minute]")].map((i) => i.id + "=" + i.value).join(","));
res.dt = { before: await startVal() };
await page.evaluate(() => { window.__live = []; const l = document.querySelector("div.sr-only[role=status]"); if (l) new MutationObserver(() => window.__live.push(l.textContent)).observe(l, { childList: true, characterData: true, subtree: true }); });
await fs.locator("input[id$=-hour]").fill("25"); await fs.locator("input[id$=-minute]").focus(); await page.waitForTimeout(300);
await fs.locator("input[id$=-minute]").fill("61"); await fs.locator("input[id$=-day]").focus(); await page.waitForTimeout(300);
await fs.locator("input[id$=-day]").fill("31"); await fs.locator("select").selectOption("2"); await fs.locator("input[id$=-year]").focus(); await page.waitForTimeout(300);
await fs.locator("input[id$=-year]").fill("2027"); await fs.locator("input[id$=-hour]").focus();
await page.waitForTimeout(800);
res.dt.after = await startVal();
res.dt.errors = await fs.locator("p.text-destructive").allTextContents();
res.dt.iconsInErrors = await fs.locator("p.text-destructive svg").count();
res.dt.invalid = await fs.locator("input[aria-invalid=true]").evaluateAll((a) => a.map((i) => i.id.split("-").pop()));
res.dt.describedby = await fs.locator("input[id$=-hour]").getAttribute("aria-describedby");
res.dt.live = await page.evaluate(() => window.__live);
await fs.scrollIntoViewIfNeeded();
await page.screenshot({ path: OUT + "event-date-errors__1440.png" });
await context.close().catch(() => {});
await browser.close();
console.log(JSON.stringify(res, null, 1));
