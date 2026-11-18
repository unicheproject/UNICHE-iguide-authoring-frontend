// P6 capture. Windows Node: node ux-audit\round-1\implementation\P6\capture.mjs <mode> [id]
import { readFileSync, existsSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";

const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const idsFile = new URL("./ids.json", import.meta.url);
export const ids = existsSync(idsFile) ? JSON.parse(readFileSync(idsFile, "utf8")) : {};
const S12 = { map: "4bbe38bb-3ba7-4c74-9caf-ae5961e0d7ed", plan: "8c1031b6-b815-4e1a-a2b3-a2b5c1a6e5e4" };
const mode = process.argv[2] ?? "map";
const id = process.argv[3];
const settle = async (page, ms = 2500) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
};
const log = (...a) => console.log(...a);

if (mode === "map") {
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    page.on("pageerror", (e) => log("PAGEERROR", e.message));
    await go(page, `/projects/${P}/maps/${id ?? ids.map ?? S12.map}`);
    await settle(page);
    await page.screenshot({ path: `${out}map__${vp}.png` });
    await page.screenshot({ path: `${out}map-full__${vp}.png`, fullPage: true });
    await browser.close();
  }
}

if (mode === "plan") {
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    page.on("pageerror", (e) => log("PAGEERROR", e.message));
    await go(page, `/projects/${P}/floor-plans/${id ?? ids.plan ?? S12.plan}`);
    await settle(page, 1500);
    await page.screenshot({ path: `${out}plan__${vp}.png` });
    await browser.close();
  }
}

// Banner shift: on an ACTIVE plan, the first pointer move on a pin must not move the image.
if (mode === "shift") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${P}/floor-plans/${id ?? S12.plan}`);
  await settle(page, 1500);
  const img = page.locator(".plan-plane img");
  const before = await img.boundingBox();
  const pin = page.locator("[data-pin]").first();
  const pb = await pin.boundingBox();
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
  await page.mouse.down();
  await page.mouse.move(pb.x + pb.width / 2 + 30, pb.y + pb.height / 2 + 12, { steps: 6 });
  await page.waitForTimeout(600);
  const during = await img.boundingBox();
  await page.screenshot({ path: `${out}plan-drag__1440.png` });
  await page.mouse.up();
  await page.waitForTimeout(600);
  const after = await img.boundingBox();
  log("image box", JSON.stringify({ before, during, after }));
  log("shift during drag (y):", during.y - before.y, "after:", after.y - before.y);
  await browser.close();
}

// Creates my own records through the dialogs (also exercises them) and saves ids.json.
if (mode === "create") {
  const { writeFileSync } = await import("node:fs");
  const { browser, page } = await open("curator", { viewport: "1440" });
  page.on("pageerror", (e) => log("PAGEERROR", e.message));
  const ids2 = { ...ids };
  await go(page, `/projects/${P}/maps`);
  await settle(page, 1500);
  const href = await page.getByRole("link", { name: "UX-P6 Map" }).first().getAttribute("href");
  ids2.map = href.split("/").pop();
  await go(page, `/projects/${P}/floor-plans`);
  await settle(page, 1500);
  await page.getByRole("button", { name: "New floor plan" }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}new-plan-dialog-empty__1440.png` });
  await page.locator("#fp-asset").click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}new-plan-picker__1440.png` });
  writeFileSync(new URL("./ids.json", import.meta.url), JSON.stringify(ids2));
  log(JSON.stringify(ids2));
  await browser.close();
}

if (mode === "createplan") {
  const { writeFileSync } = await import("node:fs");
  const { browser, page } = await open("curator", { viewport: "1440" });
  page.on("pageerror", (e) => log("PAGEERROR", e.message));
  await go(page, `/projects/${P}/floor-plans`);
  await settle(page, 1200);
  await page.getByRole("button", { name: "New floor plan" }).first().click();
  await page.locator("#fp-asset").click();
  await page.waitForTimeout(1500);
  await page.getByText("plan-archaic-gallery", { exact: true }).first().click();
  await page.getByRole("button", { name: "Use this file" }).click();
  await page.waitForTimeout(600);
  await page.locator("#fp-name").fill("UX-P6 Plan");
  await page.screenshot({ path: `${out}new-plan-filled__1440.png` });
  // The Place picker keeps Places that already have a plan, marked.
  log("place options:", JSON.stringify(await page.locator("#fp-place option").allTextContents()));
  await page.getByRole("button", { name: "Create floor plan" }).click();
  await page.waitForURL(/floor-plans\/[0-9a-f-]{36}/, { timeout: 20000 });
  const next = { ...ids, plan: page.url().split("/").pop() };
  writeFileSync(new URL("./ids.json", import.meta.url), JSON.stringify(next));
  log(JSON.stringify(next));
  await browser.close();
}

const polite = (page) => page.locator("[role=status][aria-live=polite], [aria-live=polite]").allTextContents().then((t) => t.join(" | ").slice(0, 300));
const vals = async (page, sel) => page.locator(sel).evaluateAll((els) => els.map((e) => e.value));

if (mode === "mapchecks") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await go(page, `/projects/${P}/maps/${ids.map}`);
  await settle(page, 2500);
  // A: fan-out placement
  for (const n of [0, 1, 2, 3]) await page.getByRole("button", { name: /^Place .* on the map$/ }).first().click();
  await page.waitForTimeout(500);
  const lats = await vals(page, "input[id^=pl-][id$=-lat]");
  const lngs = await vals(page, "input[id^=pl-][id$=-lng]");
  log("A placements", lats.length, "distinct positions:", new Set(lats.map((l, i) => l + "/" + lngs[i])).size, JSON.stringify(lats.map((l, i) => l + "/" + lngs[i])));
  await page.screenshot({ path: `${out}map-placed__1440.png` });
  // B: bad input
  await page.locator("#f-minLatitude").fill("abc");
  await page.locator("#pl-0-lat").fill("12,5");
  await page.locator("#pl-1-lat").fill("999");
  await page.locator("#pl-2-lng").fill("1,2,3");
  await page.waitForTimeout(500);
  log("B pageerrors after typing:", JSON.stringify(errors));
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await page.waitForTimeout(1200);
  log("B errors:", JSON.stringify(await page.locator("[id$=-error]").allTextContents()));
  await page.screenshot({ path: `${out}map-errors__1440.png` });
  log("B pageerrors after save:", JSON.stringify(errors));
  // fix field, keep 12,5 (valid, outside bounds)
  await page.locator("#f-minLatitude").fill("37.966");
  await page.locator("#pl-1-lat").fill("37.97");
  await page.locator("#pl-2-lng").fill("23.72");
  await page.waitForTimeout(500);
  log("B2 outside warning:", await page.getByText(/placed items? lie.* outside the bounds|placed item lies outside/).first().textContent().catch(() => "none"));
  await page.locator("#f-internalName").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${out}map-outside__1440.png` });
  // D: keyboard on bounds handles
  await page.getByRole("button", { name: "Edit bounds" }).click();
  await page.waitForTimeout(600);
  const handle = page.locator(".map-handle").first();
  log("D handles:", await page.locator(".map-handle").count(), "tabindex", await handle.getAttribute("tabindex"), "label", await handle.getAttribute("aria-label"));
  const before = await vals(page, "#f-minLatitude, #f-minLongitude");
  await handle.focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowUp");
  await page.waitForTimeout(500);
  const after = await vals(page, "#f-minLatitude, #f-minLongitude");
  log("D bounds fields before/after:", JSON.stringify(before), JSON.stringify(after), "still focused:", await handle.evaluate((e) => e === document.activeElement));
  log("D announced:", await polite(page));
  await page.screenshot({ path: `${out}map-bounds-edit__1440.png` });
  // Tab order into the map
  await page.keyboard.press("Tab");
  log("D next focus:", await page.evaluate(() => document.activeElement?.getAttribute("aria-label")));
  // Esc / Done
  await page.getByRole("button", { name: "Done editing bounds" }).click();
  // C: tile failure
  await page.route(/openfreemap|tile\.openstreetmap|openmaptiles/, (r) => r.abort());
  await page.reload();
  await settle(page, 3000);
  const card = page.getByText("The map background could not be loaded.");
  log("C error card visible:", await card.isVisible().catch(() => false));
  await page.screenshot({ path: `${out}map-tile-error__1440.png` });
  await page.unroute(/openfreemap|tile\.openstreetmap|openmaptiles/);
  await page.getByRole("button", { name: "Try again" }).first().click().catch((e) => log("retry click", e.message.slice(0, 80)));
  await page.waitForTimeout(3500);
  log("C after retry, card visible:", await card.isVisible().catch(() => false));
  log("pageerrors total:", JSON.stringify(errors));
  await browser.close();
}

if (mode === "planchecks") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await go(page, `/projects/${P}/floor-plans/${ids.plan}`);
  await settle(page, 1500);
  const place = () => page.getByRole("button", { name: /^Place .* on the plan$/ }).first();
  await place().click();
  await page.waitForTimeout(300);
  log("armed banner:", await page.getByText(/the plan to place/).first().textContent());
  await page.screenshot({ path: `${out}plan-armed__1440.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  log("after Esc banner count:", await page.getByText(/the plan to place/).count(), "announced:", await polite(page));
  // arm, click plan
  await place().click();
  await page.locator(".plan-plane").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await page.locator(".plan-plane").boundingBox();
  await page.mouse.click(box.x + box.width * 0.25, box.y + Math.min(box.height * 0.4, 300));
  await page.waitForTimeout(300);
  log("placed x/y:", JSON.stringify(await vals(page, "input[id^=pos-][id$=-x]")), JSON.stringify(await vals(page, "input[id^=pos-][id$=-y]")));
  // arm, keyboard route x3 (fan-out)
  for (let i = 0; i < 3; i++) {
    await place().click();
    await page.getByRole("button", { name: "Place near the centre" }).click();
  }
  const xs = await vals(page, "input[id^=pos-][id$=-x]");
  const ys = await vals(page, "input[id^=pos-][id$=-y]");
  log("fan-out positions:", JSON.stringify(xs.map((x, i) => x + "/" + ys[i])), "distinct", new Set(xs.map((x, i) => x + "/" + ys[i])).size);
  // pin keyboard nudge + announcement
  const pin = page.locator("[data-pin]").nth(1);
  await pin.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");
  await page.waitForTimeout(300);
  log("nudge announced:", await polite(page));
  // validation
  await page.locator("#pos-0-x").fill("abc");
  await page.locator("#pos-1-y").fill("1,5");
  await page.locator("#pos-2-x").fill("0,25");
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await page.waitForTimeout(1000);
  log("errors:", JSON.stringify(await page.locator("[id$=-error]").allTextContents()));
  await page.screenshot({ path: `${out}plan-errors__1440.png` });
  log("pin hit sizes (fine pointer):", JSON.stringify(await page.locator("[data-pin]").first().boundingBox()));
  log("pageerrors:", JSON.stringify(errors));
  await browser.close();
}

if (mode === "touch") {
  const { createRequire } = await import("node:module");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const here = dirname(fileURLToPath(import.meta.url));
  const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
  const { chromium } = require("@playwright/test");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    hasTouch: true,
    isMobile: true,
    storageState: join(here, "..", "..", "..", "tools", ".auth", "curator.json"),
  });
  const page = await context.newPage();
  const size = async (sel) => JSON.stringify(await page.locator(sel).first().boundingBox());
  log("coarse:", await page.evaluate(() => matchMedia("(pointer: coarse)").matches));
  await go(page, `/projects/${P}/maps/${ids.map}`);
  await settle(page, 2500);
  await page.getByRole("button", { name: /^Place .* on the map$/ }).first().click();
  await page.waitForTimeout(500);
  log("zoom button", await size(".geo-map .leaflet-control-zoom-in"));
  log("pin", await size(".geo-map .map-pin"));
  await page.getByRole("button", { name: "Edit bounds" }).click();
  await page.waitForTimeout(600);
  log("handle", await size(".map-handle"));
  await page.screenshot({ path: `${out}map-touch__820.png` });
  await go(page, `/projects/${P}/floor-plans/${ids.plan}`);
  await settle(page, 1500);
  await page.getByRole("button", { name: /^Place .* on the plan$/ }).first().click();
  await page.getByRole("button", { name: "Place near the centre" }).click();
  log("plan pin", await size("[data-pin]"));
  await page.getByRole("button", { name: /^Place .* on the plan$/ }).first().click();
  log("armed copy:", await page.getByText(/the plan to place/).first().textContent());
  await page.screenshot({ path: `${out}plan-touch__820.png` });
  await browser.close();
}

if (mode === "shots") {
  const { createRequire } = await import("node:module");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const here = dirname(fileURLToPath(import.meta.url));
  const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
  const { AxeBuilder } = require("@axe-core/playwright");
  const poi = seed.pois?.[0]?.id;
  const route = seed.routes?.[0]?.id;
  const pages = {
    map: `/projects/${P}/maps/${ids.map}`,
    plan: `/projects/${P}/floor-plans/${ids.plan}`,
    maps: `/projects/${P}/maps`,
    plans: `/projects/${P}/floor-plans`,
    poi: `/projects/${P}/pois/${poi}`,
    route: `/projects/${P}/routes/${route}`,
  };
  const only = process.argv[3] ? process.argv[3].split(",") : Object.keys(pages);
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    page.on("pageerror", (e) => log("PAGEERROR", vp, e.message));
    for (const k of only) {
      await go(page, pages[k]);
      await settle(page, 2500);
      await page.screenshot({ path: `${out}${k}__${vp}.png` });
      if (vp === "1440") {
        const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        log("axe", k, r.violations.map((v) => `${v.impact}:${v.id}:${v.nodes.length}:${v.nodes[0].target.join(" ")}`).join(" || ") || "clean");
      }
    }
    await browser.close();
  }
  // forced colours + reduced motion on principal states
  const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active", reducedMotion: "reduce" });
  for (const k of ["map", "plan"]) {
    await go(page, pages[k]);
    await settle(page, 2500);
    await page.screenshot({ path: `${out}${k}-forced__1440.png` });
  }
  await browser.close();
}

if (mode === "axe") {
  const { createRequire } = await import("node:module");
  const { join, dirname } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const here = dirname(fileURLToPath(import.meta.url));
  const require = createRequire(join(here, "..", "..", "..", "..", "package.json"));
  const { AxeBuilder } = require("@axe-core/playwright");
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${P}/maps/${ids.map}`);
  await settle(page, 2500);
  await page.getByRole("button", { name: /^Place .* on the map$/ }).first().click();
  await page.getByRole("button", { name: "Edit bounds" }).click();
  await page.waitForTimeout(800);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  for (const v of r.violations) for (const n of v.nodes) log(v.impact, v.id, n.target.join(" "), n.html.slice(0, 160));
  await browser.close();
}

if (mode === "verifyfix") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${P}/maps`);
  await settle(page, 1500);
  await page.screenshot({ path: `${out}vfix-maps__1440.png` });
  await page.getByRole("button", { name: "New map" }).first().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}vfix-new-map__1440.png` });
  await go(page, `/projects/${P}/floor-plans/${ids.plan}`);
  await settle(page, 1500);
  await page.screenshot({ path: `${out}vfix-plan__1440.png`, clip: { x: 240, y: 200, width: 780, height: 300 } });
  await browser.close();
}
