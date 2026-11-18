import { open, go, shot, settle, dash, mock, text, T, P, B, SH } from "./h.mjs";
import { createRequire } from "node:module";
import { writeFileSync, appendFileSync } from "node:fs";
const LOG = new URL("./a5.log", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
writeFileSync(LOG, "");
const log = (...a) => { console.log(...a); appendFileSync(LOG, a.join(" ") + "\n"); };
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { AxeBuilder } = require("@axe-core/playwright");

// hover with waits + axe + warnings + project details + pending links
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, dash(P)); await settle(page, 2500);
  for (const [n, loc] of [["preview", page.getByRole("link", { name: "Preview the app" }).first()], ["review", page.getByRole("button", { name: "Review warnings" })], ["about", page.getByRole("link", { name: "About Launch" })]]) {
    await loc.hover(); await page.waitForTimeout(500);
    log("hover", n, await loc.evaluate(e => { const c = getComputedStyle(e); return `bg ${c.backgroundColor} color ${c.color} deco ${c.textDecorationLine} cursor ${c.cursor}`; }));
  }
  // helphint
  await page.getByRole("button", { name: "What does the visitor app status mean?" }).click(); await settle(page, 500);
  await shot(page, "dashboard__helphint-open__1440", false);
  log("helphint text:", await page.evaluate(() => document.querySelector("[role=dialog],[role=tooltip],[data-radix-popper-content-wrapper]")?.innerText));
  await page.keyboard.press("Escape"); await settle(page, 300);
  log("focus after esc helphint:", await page.evaluate(() => document.activeElement.getAttribute("aria-label") || document.activeElement.tagName));
  // Review warnings
  await page.getByRole("button", { name: "Review warnings" }).click(); await settle(page, 700);
  log("after review focus:", await page.evaluate(() => { const e = document.activeElement; const c = getComputedStyle(e); return e.tagName + ":" + e.textContent.trim().slice(0, 30) + " outline " + c.outlineStyle + " " + c.outlineWidth; }));
  await shot(page, "dashboard__review-warnings__1440", false);
  log("scrollY", await page.evaluate(() => scrollY));
  const g = await page.$$eval("#warnings-title ~ * details, section[aria-labelledby=warnings-title] details", d => d.map(x => x.querySelector("summary").innerText.replace(/\n/g, " ")));
  log("warning groups:", JSON.stringify(g));
  log("first group rows:", JSON.stringify(await page.$$eval("section[aria-labelledby=warnings-title] details[open] li", e => e.slice(0, 6).map(x => x.innerText.slice(0, 140)))));
  log("row link heights:", JSON.stringify(await page.$$eval("section[aria-labelledby=warnings-title] details[open] li a", e => e.slice(0, 4).map(x => Math.round(x.getBoundingClientRect().height)))));
  // open all groups for a shot
  await page.$$eval("section[aria-labelledby=warnings-title] details", d => d.forEach(x => x.open = true)); await settle(page, 300);
  await page.locator("section[aria-labelledby=warnings-title]").screenshot({ path: SH + "dashboard__warnings-open__1440.png" });
  // pending footer links
  log("pending links:", JSON.stringify(await page.$$eval("section[aria-labelledby=pending-title] a", a => a.slice(-5).map(x => x.textContent.trim() + " -> " + x.getAttribute("href").replace(/[0-9a-f-]{36}/, ":id")))));
  log("pending footer:", await page.locator("section[aria-labelledby=pending-title] > div").last().innerText());
  await page.locator("section[aria-labelledby=pending-title]").screenshot({ path: SH + "dashboard__pending__1440.png" });
  // project details
  await page.locator("summary", { hasText: "Project details" }).click(); await settle(page, 300);
  log("details:", await page.locator("details", { hasText: "Project details" }).innerText());
  await shot(page, "dashboard__project-details-open__1440", false);
  // axe
  const res = await new AxeBuilder({ page }).analyze();
  log("AXE pop violations:", JSON.stringify(res.violations.map(v => v.id + ":" + v.impact + ":" + v.nodes.length)));
  // text sizes
  log("text sizes:", JSON.stringify(await page.evaluate(() => { const out = {}; for (const sel of ["main h1","#status-title","#status-title ~ p","#pending-title","#pending-title ~ p","#counts-title","table thead th","table tbody td","[aria-labelledby=pending-title] > div:last-child"]) { const e = document.querySelector(sel.startsWith("[") ? "main " + sel : sel) || document.querySelector("main " + sel); if (e) { const c = getComputedStyle(e); out[sel] = c.fontSize + "/" + c.lineHeight + "/" + c.fontWeight + " " + c.color; } } return out; })));
  await browser.close();
}
// forced colors, reduced motion
for (const [name, o] of [["forced", { forcedColors: "active" }], ["reduced", { reducedMotion: "reduce" }]]) {
  for (const [pn, id] of [["trail", T], ["pop", P]]) {
    const { browser, page } = await open("admin", { viewport: "1280", ...o });
    await go(page, dash(id)); await settle(page, 2500);
    await shot(page, `dashboard-${pn}__${name}__1280`);
    if (name === "reduced") log("reduced anims", pn, JSON.stringify(await page.evaluate(() => document.getAnimations().map(a => a.constructor.name + ":" + (a.effect?.target?.className?.toString().slice(0, 40) ?? "")))));
    if (name === "forced" && pn === "trail") {
      log("forced circles:", JSON.stringify(await page.$$eval("[data-testid=first-run-steps] li > div > span", e => e.map(x => { const c = getComputedStyle(x); return c.borderColor + "|" + c.color + "|" + c.backgroundColor; }))));
      log("forced next-step border:", JSON.stringify(await page.$$eval("[data-testid=first-run-steps] li", e => e.map(x => getComputedStyle(x).borderColor + " " + getComputedStyle(x).backgroundColor))));
    }
    await browser.close();
  }
}
console.log("done");
