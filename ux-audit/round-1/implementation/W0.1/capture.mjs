// W0 stage 0.1 capture: screenshots plus computed-style probes. Run with WINDOWS Node:
//   cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\round-1\implementation\W0.1\capture.mjs [shots|probe|keys|all]"
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { open, go, VIEWPORTS } from "../../../tools/session.mjs";

const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const poi = seed.pois[0].id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const mode = process.argv[2] ?? "all";

const screens = {
  home: "/",
  dashboard: `/projects/${P}`,
  "poi-list": `/projects/${P}/pois`,
  "poi-editor": `/projects/${P}/pois/${poi}`,
  overview: `/projects/${P}/overview`,
  languages: `/projects/${P}/languages`,
};

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(900);
}

if (mode === "shots" || mode === "all") {
  for (const vp of ["1440", "1024", "768", "zoom200"]) {
    const { browser, page } = await open("curator", { viewport: vp });
    for (const [name, path] of Object.entries(screens)) {
      if ((name === "overview" || name === "languages") && vp !== "1440") continue;
      await go(page, path);
      await settle(page);
      await page.screenshot({ path: `${out}${name}__${vp}.png`, fullPage: false });
    }
    // One dialog: the create dialog of the POI list.
    await go(page, screens["poi-list"]);
    await settle(page);
    const create = page.getByRole("button", { name: /new point of interest|new poi|create/i }).first();
    if (await create.count()) {
      await create.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}dialog__${vp}.png` });
    }
    if (vp === "1024" || vp === "768") {
      await go(page, `/projects/${P}`);
      await settle(page);
      const toggle = page.locator("#nav-toggle");
      if (await toggle.count()) {
        await toggle.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${out}drawer__${vp}.png` });
      }
    }
    await browser.close();
  }
  const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
  for (const name of ["dashboard", "poi-list"]) {
    await go(page, screens[name]);
    await settle(page);
    await page.screenshot({ path: `${out}${name}__forced-colors.png` });
  }
  await browser.close();
}

if (mode === "probe" || mode === "all") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  const report = {};
  for (const [name, path] of Object.entries(screens)) {
    await go(page, path);
    await settle(page);
    report[name] = await page.evaluate(() => {
      const small = [];
      const upper = [];
      const inRem = new Set();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || el.closest(".sr-only")) continue;
        const rect = el.getBoundingClientRect();
        if (!rect.width) continue;
        const px = parseFloat(cs.fontSize);
        if (px < 12 && !el.closest("[aria-hidden='true']")) small.push(`${px}px ${el.tagName} "${n.textContent.trim().slice(0, 30)}"`);
        if (cs.textTransform === "uppercase") upper.push(`${el.tagName} "${n.textContent.trim().slice(0, 30)}"`);
      }
      const fields = [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select")].map((el) => {
        const cs = getComputedStyle(el);
        return { tag: el.tagName, border: cs.borderTopColor, width: cs.borderTopWidth };
      });
      return { small: small.slice(0, 15), smallCount: small.length, upper: upper.slice(0, 10), upperCount: upper.length, fields: fields.slice(0, 6) };
    });
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    report[name].axe = results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.html.slice(0, 160) }));
  }
  writeFileSync(`${out}probe.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

if (mode === "keys" || mode === "all") {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, "/");
  await settle(page);
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  const log = { firstTabStop: first };
  await go(page, `/projects/${P}`);
  await settle(page);
  // Navigate in-app through the router to the POI list by clicking the nav link.
  await page.getByRole("link", { name: "Points of Interest" }).first().click();
  await page.waitForTimeout(1500);
  log.afterRouteChange = await page.evaluate(() => ({
    active: document.activeElement?.tagName + ":" + document.activeElement?.textContent?.trim().slice(0, 40),
    title: document.title,
    live: [...document.querySelectorAll("[aria-live]")].map((e) => e.getAttribute("aria-live") + ":" + e.textContent).join(" / "),
  }));
  writeFileSync(`${out}keys.json`, JSON.stringify(log, null, 2));
  console.log(JSON.stringify(log, null, 2));
  await browser.close();
}

if (mode === "rm") {
  const { browser, page } = await open("curator", { viewport: "1440", reducedMotion: "reduce" });
  await go(page, `/projects/${P}/pois`);
  const samples = [];
  for (let i = 0; i < 6; i++) {
    samples.push(await page.evaluate(() => ({ animations: document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity).length, skeleton: !!document.querySelector(".animate-skeleton") })));
    await page.waitForTimeout(150);
  }
  console.log(JSON.stringify(samples));
  writeFileSync(`${out}reduced-motion.json`, JSON.stringify(samples, null, 2));
  await browser.close();
}
