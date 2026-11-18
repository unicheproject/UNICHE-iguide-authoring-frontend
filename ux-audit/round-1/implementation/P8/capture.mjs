// P8 capture + probes. WINDOWS Node:
//   cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\round-1\implementation\P8\capture.mjs [shots|probe|keys|tab|panel|all]"
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";

const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const poi = seed.pois[0].id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const mode = process.argv[2] ?? "all";
const page_ = `/projects/${P}/preview`;
const settle = async (page) => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForSelector("[data-preview-frame], [role=alert]", { timeout: 40000 }).catch(() => {}); await page.waitForTimeout(2500); };
const axe = async (page, name) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  console.log(`axe ${name}: ${r.violations.length} violations, ${bad.length} serious/critical`, r.violations.map((v) => `${v.id}(${v.impact}):${v.nodes.length}`).join(", "));
  for (const v of bad) console.log("  ", v.id, v.nodes[0]?.html?.slice(0, 160));
};

if (mode === "shots" || mode === "all") {
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, page_); await settle(page);
    await page.screenshot({ path: `${out}preview-web__${vp}.png`, fullPage: true });
    await page.getByRole("tab", { name: "Mobile" }).click(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}preview-mobile__${vp}.png`, fullPage: true });
    await page.getByRole("tab", { name: "Kiosk" }).click(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}preview-kiosk__${vp}.png`, fullPage: true });
    await browser.close();
  }
  const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
  await go(page, page_); await settle(page);
  await page.screenshot({ path: `${out}preview-web__forced.png`, fullPage: true });
  await browser.close();
}

if (mode === "probe" || mode === "all") {
  const { browser, page } = await open("curator", { viewport: "768" });
  await go(page, page_); await settle(page);
  const info = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    h2: [...document.querySelectorAll("h2")].length,
    region: document.querySelector('[role="region"][aria-label^="Preview"]')?.getAttribute("aria-label"),
    frame: document.querySelector("[data-preview-frame]")?.getAttribute("data-scale"),
    focusableInFrame: [...document.querySelectorAll("[data-preview-frame] *")].filter((e) => e.matches("button,a,input,select,[tabindex]") && !e.closest("[inert]")).length,
    inert: !!document.querySelector("[data-preview-frame] [inert]"),
  }));
  console.log("768 web", info);
  await axe(page, "preview page 768 web");
  await page.getByRole("tab", { name: "Kiosk" }).click(); await page.waitForTimeout(500);
  console.log("kiosk scale", await page.evaluate(() => document.querySelector("[data-preview-frame]").getAttribute("data-scale")));
  await axe(page, "preview page 768 kiosk");
  await page.getByRole("tab", { name: "Mobile" }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Interact with the preview" }).click(); await page.waitForTimeout(300);
  console.log("interactive inert?", await page.evaluate(() => !!document.querySelector("[data-preview-frame] [inert]")));
  await axe(page, "preview page interactive");
  await browser.close();
  // fire trigger
  const b = await open("curator", { viewport: "1440" });
  await go(b.page, page_); await settle(b.page);
  await b.page.getByRole("tab", { name: "Mobile" }).click();
  const sel = b.page.locator("#fire-trigger");
  const opts = await sel.locator("option").allTextContents();
  console.log("mobile options", opts.slice(0, 12), opts.length);
  const qr = (await sel.locator("optgroup[label='QR codes'] option").first().getAttribute("value"));
  if (qr) { await sel.selectOption(qr); await b.page.getByRole("button", { name: "Fire", exact: true }).click(); await b.page.waitForTimeout(600); }
  await b.page.screenshot({ path: `${out}preview-fired__1440.png`, fullPage: true });
  console.log("chip", await b.page.getByText(/^Fired:/).textContent().catch(() => "none"));
  await b.page.getByRole("tab", { name: "Web" }).click(); await b.page.waitForTimeout(300);
  console.log("chip after surface change", await b.page.getByText(/^Fired:/).count());
  const web = await sel.locator("option").allTextContents();
  console.log("web options has beacon?", web.some((o) => /beacon/i.test(o)));
  await b.page.getByRole("tab", { name: "Live" }).click(); await b.page.waitForTimeout(300);
  console.log("notes", await b.page.locator("#fire-trigger-notes").textContent());
  await b.page.getByRole("tab", { name: "Working" }).click(); await b.page.waitForTimeout(300);
  console.log("status", await b.page.locator('[role="status"]').allTextContents());
  await b.browser.close();
}

if (mode === "keys" || mode === "all") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, page_); await settle(page);
  // Count tab stops from the region start to the next CMS control after the frame.
  await page.getByRole("tab", { name: "Mobile" }).click();
  await page.locator("#fire-trigger").focus();
  const stops = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    stops.push(await page.evaluate(() => { const e = document.activeElement; return `${e.tagName}${e.id ? "#" + e.id : ""} ${(e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 40)} inFrame=${!!e.closest("[data-preview-frame]")}`; }));
  }
  console.log("tab order after fire select:\n" + stops.join("\n"));
  await page.keyboard.press("Shift+Tab");
  await browser.close();
}

if (mode === "tab" || mode === "all") {
  for (const vp of ["1440", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${P}/app-preview?surface=kiosk&lang=EL&mode=live`); await settle(page);
    await page.screenshot({ path: `${out}newtab-kiosk-el__${vp}.png` });
    console.log("title", await page.title(), "h1", await page.locator("h1").count());
    await go(page, `/projects/${P}/app-preview?surface=tablet&lang=xx&mode=foo`); await settle(page);
    await page.screenshot({ path: `${out}newtab-invalid__${vp}.png` });
    console.log("title", await page.title());
    if (vp === "1440") {
      await axe(page, "new tab invalid");
      await go(page, `/projects/${P}/app-preview?surface=MOBILE&t=zzz`); await settle(page);
      await page.screenshot({ path: `${out}newtab-mobile__${vp}.png` });
      await axe(page, "new tab mobile");
      await go(page, `/projects/00000000-0000-0000-0000-000000000000/app-preview`); await settle(page);
      await page.screenshot({ path: `${out}newtab-404__${vp}.png` });
      console.log("404 title", await page.title());
      await axe(page, "new tab 404");
    }
    await browser.close();
  }
}

if (mode === "panel" || mode === "all") {
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${P}/pois/${poi}`); await settle(page);
    const btn = page.getByRole("button", { name: /preview in app/i }).first();
    await btn.click(); await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}panel__${vp}.png` });
    if (vp === "1440") {
      console.log("panel region", await page.locator('[role="region"][aria-label^="Preview"]').getAttribute("aria-label"));
      await axe(page, "editor panel");
      await page.getByRole("tab", { name: "Kiosk" }).click(); await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}panel-kiosk__${vp}.png` });
    }
    await browser.close();
  }
}
