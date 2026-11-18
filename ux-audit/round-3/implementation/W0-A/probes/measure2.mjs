// W0-A probe 2 (dist build served through routing): 15-dialog Tab order, zoom200, z-layers, HelpHint, pressed (6), forced colours, axe, out-of-scope shots, 503.
import { createRequire } from "node:module";
import { open, go, VIEWPORTS } from "../../../../tools/session.mjs";
import { serveDist } from "./dist.mjs";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const AxeBuilder = require("@axe-core/playwright").default;
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const OUT = "ux-audit/round-3/implementation/W0-A/after/";
const res = {};
const { browser, context, page } = await open("admin");
await serveDist(context);
process.on("uncaughtException", (e) => { console.log(JSON.stringify(res, null, 1)); console.log("FAILED", e.message.split("\n")[0]); process.exit(1); });
const ready = async (sel) => { await page.waitForSelector(sel, { timeout: 20000 }); await page.waitForTimeout(500); };
const axe = async (name) => { const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze(); res.axe = { ...(res.axe ?? {}), [name]: r.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`) }; };

// Dialog Tab order over 5 create dialogs x (open via primary button)
res.tabFirst = {};
for (const kind of ["places", "pois", "routes", "guides", "events", "categories"]) {
  await go(page, `/projects/${P}/${kind}`);
  await ready("main [data-variant=primary]");
  await page.locator("main [data-variant=primary]").first().click();
  await page.waitForSelector("[role=dialog]"); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector("[role=dialog]").focus());
  await page.keyboard.press("Tab");
  res.tabFirst[kind] = await page.evaluate(() => document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.trim().slice(0, 20));
  if (kind === "pois") {
    await axe("create-poi-dialog");
    await page.screenshot({ path: OUT + "dialog-create-poi__1440.png" });
    // forced colours with dialog + a focused primary
    await page.emulateMedia({ forcedColors: "active" });
    await page.locator("[role=dialog] [data-variant=primary]").focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
    await page.screenshot({ path: OUT + "forced-colours-dialog__1440.png" });
    await page.emulateMedia({ forcedColors: "none" });
  }
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
}
// Confirm dialogs (Discard) tab order and Esc return
await go(page, `/projects/${P}/pois`); await ready("main [data-variant=primary]");
await page.locator("main [data-variant=primary]").first().click(); await page.waitForSelector("[role=dialog]");
await page.locator("[role=dialog] input").first().fill("x");
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
res.confirmTabFirst = await page.evaluate(() => { const d = document.querySelectorAll("[role=dialog]"); const top = d[d.length - 1]; top.focus(); return d.length; });
await page.keyboard.press("Tab");
res.confirmFirstTab = await page.evaluate(() => document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.trim());
await page.keyboard.press("Escape"); await page.waitForTimeout(500); await page.keyboard.press("Escape"); await page.waitForTimeout(300);

// zoom 200 (640x360 CSS px): create dialog primary visible
await page.setViewportSize({ width: 640, height: 360 });
await go(page, `/projects/${P}/pois`); await ready("main [data-variant=primary]");
await page.locator("main [data-variant=primary]").first().click(); await page.waitForSelector("[role=dialog]"); await page.waitForTimeout(500);
res.zoom200 = await page.evaluate(() => { const b = [...document.querySelectorAll("[role=dialog] button")].find((x) => /Create and open/.test(x.textContent)); const r = b.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, viewportH: innerHeight, visible: r.top >= 0 && r.bottom <= innerHeight, docScroll: document.scrollingElement.scrollHeight - innerHeight }; });
await page.screenshot({ path: OUT + "dialog-create-poi__zoom200.png" });
await page.keyboard.press("Escape"); await page.waitForTimeout(300);
await page.setViewportSize({ width: 1440, height: 900 });

// z-layer: HelpHint inside a dialog (Activate? use Place editor Working copy hint) -> test generically through a synthetic popover
await go(page, `/projects/${P}/pois`); await ready("main [data-variant=primary]");
res.z = await page.evaluate(() => { const cs = (c) => { const e = document.createElement("div"); e.className = c; document.body.appendChild(e); const z = getComputedStyle(e).zIndex; e.remove(); return z; }; return { popoverOver: cs("z-popover-over"), modal: cs("z-modal"), modalOver: cs("z-modal-over"), popover: cs("z-popover"), logo: (() => { const e = document.createElement("div"); e.className = "h-logo"; document.body.appendChild(e); const h = getComputedStyle(e).height; e.remove(); return h; })() }; });
// real HelpHint
const hh = page.locator("button[aria-label^='What is']").first();
res.helpHintCount = await hh.count();
if (res.helpHintCount) { const b = await hh.boundingBox(); res.helpHintBox = { w: b.width, h: b.height }; }

// pressed: danger, danger-outline, tab, via real components where possible
await go(page, `/projects/${P}/maps`); await ready("nav a.ui-tab");
const pr = {};
async function press(loc, name) {
  const box = await loc.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(250);
  const hover = await loc.evaluate((e) => getComputedStyle(e).backgroundColor);
  await page.mouse.down(); await page.waitForTimeout(250);
  const active = await loc.evaluate((e) => getComputedStyle(e).backgroundColor);
  await page.mouse.move(700, 20); await page.mouse.up(); await page.waitForTimeout(150);
  pr[name] = { hover, active, differs: hover !== active };
}
await press(page.locator("nav a.ui-tab").nth(1), "tab");
await page.evaluate(() => { const host = document.querySelector("main"); const mk = (cls, text, left) => { const b = document.createElement("button"); b.type = "button"; b.textContent = text; b.className = cls; b.style.cssText = `position:fixed;top:300px;left:${left}px;z-index:9999`; b.id = "probe-" + text; document.body.appendChild(b); }; mk("inline-flex min-h-control items-center rounded-md border border-destructive bg-card px-4 text-destructive hover:bg-destructive-tint active:bg-destructive/20", "dangerOutline", 20); mk("inline-flex min-h-control items-center rounded-md border border-transparent bg-destructive px-4 text-destructive-foreground hover:bg-destructive/90 active:bg-destructive-active", "danger", 220); });
await press(page.locator("#probe-dangerOutline"), "dangerOutline");
await press(page.locator("#probe-danger"), "danger");
await page.evaluate(() => document.querySelectorAll("[id^=probe-]").forEach((e) => e.remove()));
res.pressed6 = pr;

// Menu highlight forced colours
await go(page, `/projects/${P}/pois`); await ready("tbody tr");
await page.emulateMedia({ forcedColors: "active" });
const kebab = page.locator("tbody tr").first().locator("button[aria-label^=Actions]");
await kebab.focus(); await page.keyboard.press("Enter"); await page.waitForSelector("[role=menu]"); await page.keyboard.press("ArrowDown"); await page.waitForTimeout(300);
res.forcedMenu = await page.evaluate(() => [...document.querySelectorAll("[role=menu] [role=menuitem]")].map((i) => { const cs = getComputedStyle(i); return { hl: i.hasAttribute("data-highlighted"), outline: cs.outlineStyle + " " + cs.outlineWidth, border: cs.borderTopWidth, bg: cs.backgroundColor }; }));
await page.screenshot({ path: OUT + "forced-colours-menu-open__1440.png", clip: { x: 640, y: 120, width: 800, height: 500 } });
await page.keyboard.press("Escape"); await page.emulateMedia({ forcedColors: "none" });
await page.waitForTimeout(300);

// 503 on three surfaces: Places list, Events list, POI editor (same sentence, one request-id row)
const problem = { type: "about:blank", title: "Service Unavailable", status: 503, code: "SERVICE_UNAVAILABLE", requestId: "req-w0a-503", detail: "boom" };
await context.route(`**/projects/${P}/places?*`, (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify(problem) }));
await context.route(`**/projects/${P}/events?*`, (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify(problem) }));
await context.route(`**/projects/${P}/pois?*`, (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify(problem) }));
res.e503 = {};
for (const s of ["places", "events", "pois"]) {
  await go(page, `/projects/${P}/${s}`); await page.waitForTimeout(2500);
  res.e503[s] = await page.evaluate(() => { const a = [...document.querySelectorAll("main [role=alert]")][0]; return a ? { text: a.innerText.replace(/\n+/g, " | ").slice(0, 300), requestRows: a.querySelectorAll("[data-request-id]").length, copyBtn: !!a.querySelector("button") } : null; });
  if (s === "places") await page.screenshot({ path: OUT + "error-503-places__1440.png" });
}
await context.unroute(`**/projects/${P}/places?*`); await context.unroute(`**/projects/${P}/events?*`); await context.unroute(`**/projects/${P}/pois?*`);

// RTL dir=auto
await go(page, `/projects/${P}/pois`); await ready("main [data-variant=primary]");
await page.locator("main [data-variant=primary]").first().click(); await page.waitForSelector("[role=dialog]");
const inp = page.locator("[role=dialog] input").first();
await inp.fill("مرحبا (متحف)!");
res.rtl = await inp.evaluate((e) => ({ dirAttr: e.getAttribute("dir"), forcedDir: getComputedStyle(e).direction, textAlign: getComputedStyle(e).textAlign, value: e.value }));
await page.keyboard.press("Escape"); await page.waitForTimeout(400); await page.getByRole("button", { name: /^Discard$/ }).click().catch(() => {});

// Out-of-scope screens: one screenshot each
const OOS = ["overview", "languages", "surfaces", "translations", "navigation", "app-settings"];
res.oos = {};
for (const s of OOS) {
  await go(page, `/projects/${P}/${s}`); await page.waitForSelector("main h1", { timeout: 20000 }).catch(() => {}); await page.waitForTimeout(1200);
  res.oos[s] = { h1: await page.locator("main h1").first().innerText().catch(() => "none") };
  await page.screenshot({ path: OUT + `out-of-scope-${s}__1440.png` });
}
// Section view: find section slug? SectionView handles generic sections e.g. pages
await go(page, `/projects/${P}/pages`); await page.waitForTimeout(1500);
res.oos.section = { h1: await page.locator("main h1").first().innerText().catch(() => "none") };
await page.screenshot({ path: OUT + "out-of-scope-section__1440.png" });
await axe("pages-section");

// axe: lists + editor + event editor
for (const [name, url, sel] of [["pois-list", `/projects/${P}/pois`, "tbody tr"], ["maps", `/projects/${P}/maps`, "nav a.ui-tab"], ["event-editor", `/projects/${P}/events/6e8462e3-a8b5-4f4b-a625-6140c1fd117e`, "fieldset"]]) {
  await go(page, url); await ready(sel); await axe(name);
}
await browser.close();
console.log(JSON.stringify(res, null, 1));
