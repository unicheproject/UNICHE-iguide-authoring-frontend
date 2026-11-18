import { open, go, P, settle, shot, save, focusDesc } from "./h.mjs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../../package.json", import.meta.url));
const AxeBuilder = require("@axe-core/playwright").default ?? require("@axe-core/playwright");
const res = {};
const { browser, context, page } = await open("admin", { viewport: "1440" });
const summary = () => page.evaluate(() => { const s = document.querySelector("[data-error-summary]"); return { text: s?.innerText.replace(/\n+/g, " | "), focus: document.activeElement?.hasAttribute("data-error-summary"), alerts: document.querySelectorAll("[role=dialog] [role=alert]").length }; });
// Route create: keyboard choose Setting, 503, offline
await go(page, `/projects/${P}/routes`); await page.waitForSelector("[data-row-id]"); await settle(page, 500);
await page.getByRole("button", { name: "New route" }).first().click(); await settle(page, 400);
await page.keyboard.type("UX-R3-P3a route 503"); await page.keyboard.press("Tab"); // slug button? tab to radio
const f1 = await focusDesc(page); res.afterTitleTab = f1;
while (!(await page.evaluate(() => document.activeElement?.type === "radio"))) await page.keyboard.press("Tab");
await page.keyboard.press("ArrowRight"); res.radioChecked = await page.evaluate(() => [...document.querySelectorAll("[role=dialog] input[type=radio]")].map((r) => r.checked));
await page.route(/\/routes$/, (r) => r.request().method() === "POST" ? r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "x", status: 503, code: "UNAVAILABLE", requestId: "req-p3a-503" }) }) : r.continue());
await page.getByRole("button", { name: /^Create and open/ }).click(); await settle(page, 800);
res.route503 = await summary(); await shot(page, "create-routes-503__1440");
await page.unroute(/\/routes$/);
await context.setOffline(true);
await page.getByRole("button", { name: /^Create and open/ }).click(); await settle(page, 800);
res.routeOffline = await summary(); await shot(page, "create-routes-offline__1440");
await context.setOffline(false);
res.axeRouteDialog = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`);
await page.keyboard.press("Escape"); await settle(page, 400);
await page.getByRole("button", { name: "Discard" }).click({ timeout: 2000 }).catch(() => {});
// Place + POI 503
for (const [k, label, noun] of [["places", "New place", "place"], ["pois", "New point of interest", "point of interest"]]) {
  await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 500);
  await page.getByRole("button", { name: label }).first().click(); await settle(page, 400);
  await page.keyboard.type(`UX-R3-P3a ${noun} 503`);
  const pat = new RegExp(`/${k}$`);
  await page.route(pat, (r) => r.request().method() === "POST" ? r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "x", status: 503, code: "UNAVAILABLE", requestId: "req-p3a-503" }) }) : r.continue());
  await page.getByRole("button", { name: /^Create and open/ }).click(); await settle(page, 800);
  res[`${k}503`] = await summary(); await shot(page, `create-${k}-503__1440`);
  await page.unroute(pat);
  await page.keyboard.press("Escape"); await settle(page, 300);
  await page.getByRole("button", { name: "Discard" }).click({ timeout: 2000 }).catch(() => {});
}
// Categories aborted: POI and Routes lists
for (const k of ["pois", "routes"]) {
  await page.route(/\/categories(\?|$)/, (r) => r.abort());
  await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]", { timeout: 15000 }).catch(() => {}); await settle(page, 1200);
  res[`catAbort-${k}`] = await page.evaluate(() => ({ rows: document.querySelectorAll("[data-row-id]").length, notice: [...document.querySelectorAll("[role=alert], [role=status]")].map((e) => e.innerText.replace(/\n+/g, " | ")).filter((t) => /Categories/.test(t)), tryAgain: !![...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Try again") }));
  await shot(page, `${k}-categories-aborted__1440`);
  res[`catAbortAxe-${k}`] = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`);
  await page.unroute(/\/categories(\?|$)/);
}
// Triggers failed
await page.route(/\/triggers(\?|$)/, (r) => r.abort());
await go(page, `/projects/${P}/pois`); await page.waitForSelector("[data-row-id]", { timeout: 15000 }).catch(() => {}); await settle(page, 1200);
res.triggersAbort = await page.evaluate(() => ({ rows: document.querySelectorAll("[data-row-id]").length, notLoaded: document.body.innerText.split("Triggers not loaded").length - 1, notice: [...document.querySelectorAll("[role=alert]")].map((e) => e.innerText.replace(/\n+/g, " | ")).filter((t) => /Trigger/.test(t)) }));
await shot(page, "pois-triggers-failed__1440");
await page.unroute(/\/triggers(\?|$)/);
// axe on the three lists, with Filters open on pois
for (const k of ["places", "pois", "routes"]) {
  await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 600);
  res[`axe-${k}`] = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`);
}
await go(page, `/projects/${P}/pois`); await page.waitForSelector("[data-row-id]"); await page.getByRole("button", { name: /^Filters/ }).click(); await settle(page, 400);
await shot(page, "pois-filters-popover__1440");
res.axePoisFilters = (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`);
res.popoverLabels = await page.evaluate(() => [...document.querySelectorAll("[role=dialog] label")].map((l) => l.textContent.trim().slice(0, 30)));
save("flows", res);
console.log(JSON.stringify(res, null, 1));
await browser.close();
