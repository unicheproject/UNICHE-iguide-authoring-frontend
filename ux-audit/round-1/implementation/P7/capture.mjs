// P7 capture + probes. WINDOWS Node:
//   cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\round-1\implementation\P7\capture.mjs [lib|upload|picker|editor|all]"
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";

const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const win = (u) => u.pathname.replace(/^\/([A-Za-z]:)/, "$1");
const out = win(new URL("./after/", import.meta.url));
const fx = (n) => win(new URL(`./fixtures/${n}`, import.meta.url)).replaceAll("%20", " ");
const mode = process.argv[2] ?? "all";
const VPS = ["1440", "1024", "768", "zoom200"];
const draftPoi = "cb763579-1082-45a7-8038-ed6a91ecc3d4";
const axe = async (page, name) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  console.log(`axe ${name}: ${r.violations.length} violations, ${bad.length} serious/critical`, r.violations.map((v) => `${v.id}(${v.impact}):${v.nodes.length}`).join(", "));
  for (const v of r.violations) console.log("  ", v.id, v.nodes[0]?.html?.slice(0, 200));
};
const settle = async (page) => { await page.waitForLoadState("networkidle").catch(() => {}); await page.waitForTimeout(1500); await page.evaluate(() => document.querySelectorAll("vite-error-overlay").forEach((e) => e.remove())); };

if (mode === "lib" || mode === "all") {
  for (const vp of VPS) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${P}/media`); await settle(page);
    await page.screenshot({ path: `${out}library-grid__${vp}.png`, fullPage: vp === "1440" ? false : false });
    await page.getByRole("button", { name: "List", exact: true }).click(); await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}library-list__${vp}.png` });
    if (vp === "1440") {
      await axe(page, "library list");
      await page.getByRole("button", { name: "Grid", exact: true }).click();
      await page.getByRole("checkbox", { name: /No alt text/ }).check(); await page.waitForTimeout(600);
      await page.screenshot({ path: `${out}library-noalt__${vp}.png` });
      console.log("noalt count text:", await page.locator("[data-media-count]").innerText());
      const tiles = await page.locator("ul[aria-label='Media files'] > li").count();
      const chips = await page.locator("ul[aria-label='Media files'] > li", { hasText: "No alt text" }).count();
      console.log("noalt tiles", tiles, "with chip", chips);
      await axe(page, "library grid filtered");
      await page.getByRole("checkbox", { name: /No alt text/ }).uncheck();
      await page.getByRole("checkbox", { name: "Unused" }).check(); await page.waitForTimeout(400);
      await page.screenshot({ path: `${out}library-unused__${vp}.png` });
      await page.getByRole("checkbox", { name: "Unused" }).uncheck();
      await page.locator("select").filter({ hasText: "Updated" }).selectOption("name"); await page.waitForTimeout(400);
      console.log("sorted url", page.url());
      await page.getByRole("searchbox", { name: "Search" }).fill("zzzzqq"); await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}library-filtered-empty__${vp}.png` });
    }
    await browser.close();
  }
  const { browser, page } = await open("curator", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/media`); await settle(page);
  await page.screenshot({ path: `${out}library-grid__forced.png` });
  await browser.close();
}

if (mode === "upload" || mode === "all") {
  for (const vp of VPS) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${P}/media`); await settle(page);
    await page.getByRole("button", { name: "Upload files" }).first().click(); await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}upload-empty__${vp}.png` });
    if (vp === "1440") {
      await axe(page, "upload empty");
      const dlg = page.getByRole("dialog");
      await dlg.locator("input[type=file]").setInputFiles([fx("UX-P7 landscape.png"), fx("UX-P7 portrait.png"), fx("UX-P7 notes.txt"), fx("UX-P7 tone.wav")]);
      await page.waitForTimeout(4000);
      await page.screenshot({ path: `${out}upload-queue__${vp}.png` });
      console.log("log:", await dlg.locator("[role=log] li").allInnerTexts());
      await axe(page, "upload queue");
      // skip the .txt
      await dlg.getByRole("button", { name: /Skip UX-P7 notes/ }).click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${out}upload-queue-skipped__${vp}.png` });
      await dlg.locator("input[type=file]").setInputFiles([fx("UX-P7 landscape.png")]);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `${out}upload-duplicate__${vp}.png` });
      await dlg.getByRole("button", { name: /Skip UX-P7 landscape/ }).click();
      await dlg.getByRole("button", { name: /Describe now/ }).click(); await page.waitForTimeout(800);
      await page.screenshot({ path: `${out}describe-now__${vp}.png` });
      await axe(page, "describe now");
      await page.getByRole("dialog").last().getByRole("textbox").fill("UX-P7 a red to green gradient, wide");
      await page.getByRole("button", { name: /Save and next/ }).click(); await page.waitForTimeout(1200);
      await page.screenshot({ path: `${out}describe-now-2__${vp}.png` });
      await page.getByRole("dialog").last().getByRole("checkbox").check();
      await page.getByRole("button", { name: /Save and finish/ }).click(); await page.waitForTimeout(1200);
      await page.screenshot({ path: `${out}upload-after-describe__${vp}.png` });
    }
    await browser.close();
  }
}

if (mode === "picker" || mode === "all") {
  for (const vp of VPS) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, `/projects/${P}/pois/${draftPoi}`); await settle(page);
    await page.getByRole("button", { name: /^Add image/ }).first().scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: /^Add image/ }).first().click(); await page.waitForTimeout(1200);
    console.log(vp, "focus", await page.evaluate(() => document.activeElement?.id));
    await page.screenshot({ path: `${out}picker__${vp}.png` });
    const box = await page.getByRole("dialog").boundingBox();
    console.log(vp, "dialog h", box?.height);
    if (vp === "1440" || vp === "zoom200") await axe(page, `picker ${vp}`);
    if (vp === "1440") {
      await page.getByRole("button", { name: "List", exact: true }).click(); await page.waitForTimeout(400);
      await page.screenshot({ path: `${out}picker-list__${vp}.png` });
      await page.getByRole("button", { name: "Any status", exact: true }).click(); await page.waitForTimeout(400);
      await page.screenshot({ path: `${out}picker-any__${vp}.png` });
      await page.keyboard.press("Escape"); await page.waitForTimeout(400);
      console.log("focus after close:", await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 30)));
    }
    await browser.close();
  }
}

if (mode === "editor" || mode === "all") {
  // Find the UX-P7 asset through the API list page.
  const { browser: b0, page: p0 } = await open("curator", { viewport: "1440" });
  await go(p0, `/projects/${P}/media?q=UX-P7`); await settle(p0);
  const href = await p0.getByRole("link", { name: /UX-P7 landscape/ }).first().getAttribute("href");
  console.log("asset href", href);
  await b0.close();
  for (const vp of VPS) {
    const { browser, page } = await open("curator", { viewport: vp });
    await go(page, href); await settle(page);
    await page.screenshot({ path: `${out}editor__${vp}.png` });
    if (vp === "1440") {
      await page.screenshot({ path: `${out}editor-full__${vp}.png`, fullPage: true });
      const alt = page.getByRole("textbox", { name: /Alternative text/ }).first();
      const ab = await alt.boundingBox();
      console.log("alt field box 1280-ish:", ab);
      await alt.focus(); await page.keyboard.type("x");
      const img = await page.locator("main img").first().boundingBox();
      console.log("img box after typing", img);
      await axe(page, "asset editor");
      await page.keyboard.press("Control+a"); await page.keyboard.press("Delete");
    }
    await browser.close();
  }
  const { browser, page } = await open("curator", { viewport: "1280" });
  await go(page, href); await settle(page);
  await page.screenshot({ path: `${out}editor__1280.png` });
  console.log("1280 alt box", await page.getByRole("textbox", { name: /Alternative text/ }).first().boundingBox(), "img", await page.locator("main img").first().boundingBox());
  await browser.close();
  const f = await open("curator", { viewport: "1440", forcedColors: "active" });
  await go(f.page, href); await settle(f.page);
  await f.page.screenshot({ path: `${out}editor__forced.png` });
  await f.browser.close();
}
