import AxeBuilder from "@axe-core/playwright";
import { open, go, P, KINDS, settle, shot, save } from "./h.mjs";
const out = { axe: {}, greek: {}, errors: {}, keyboard: {}, filters: {} };
const overlap = () => [...document.querySelectorAll("[data-row-id]")].map((r) => {
  const cells = [...r.querySelectorAll(":scope > td")]; let bad = 0;
  for (let i = 0; i < cells.length; i++) { if (cells[i].scrollWidth > cells[i].clientWidth + 1) bad++; for (let j = i + 1; j < cells.length; j++) { const a = cells[i].getBoundingClientRect(), b = cells[j].getBoundingClientRect(); if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) bad++; } }
  const link = r.querySelector("a"); const lh = parseFloat(getComputedStyle(link).lineHeight);
  return { len: link.textContent.trim().length, lines: Math.round(link.getBoundingClientRect().height / lh), bad, w: Math.round(r.querySelector(".list-tree-cell")?.getBoundingClientRect().width ?? 0), h: Math.round(r.getBoundingClientRect().height) };
});
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  for (const k of KINDS) {
    await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]", { timeout: 20000 }).catch(() => {}); await settle(page, 600);
    await shot(page, `${k}__${vp}`);
    if (vp !== "zoom200") {
      await go(page, `/projects/${P}/${k}?q=UX-R3-P3b`); await settle(page, 1200);
      out.greek[`${k}@${vp}`] = await page.evaluate(overlap);
      await shot(page, `${k}-greek__${vp}`);
    }
    if (vp === "1440" || vp === "1024") {
      await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 500);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      out.axe[`${k}@${vp}`] = axe.violations.map((v) => `${v.id}:${v.impact}:${v.nodes.length}`);
    }
    // filtered empty
    await go(page, `/projects/${P}/${k}?q=zzzznomatch`); await settle(page, 900);
    if (vp === "1440" || vp === "zoom200") await shot(page, `${k}-filtered-empty__${vp}`);
    // 503 list error
    if (vp !== "768") {
      await page.route(`**/${k}**`, (route) => route.request().method() === "GET" && !/triggers|categories\?/.test(route.request().url()) ? route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "urn:uniche:iguide:problem:SERVICE_UNAVAILABLE", title: "x", status: 503, code: "SERVICE_UNAVAILABLE", requestId: "req-p3b-list" }) }) : route.fallback());
      await go(page, `/projects/${P}/${k}`); await settle(page, 1200);
      out.errors[`${k}@${vp}`] = await page.evaluate(() => ({ active: document.activeElement.tagName, text: document.activeElement.textContent.slice(0, 50), rid: document.querySelectorAll("[data-request-id], .request-id").length, body: document.querySelector("main")?.innerText.replace(/\s+/g, " ").slice(0, 220) }));
      if (vp === "1440") await shot(page, `${k}-error__1440`);
      await page.unroute(`**/${k}**`);
    }
  }
  await browser.close();
}
// forced colours principal state
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  for (const k of KINDS) { await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 500); await shot(page, `${k}-forced-colours__1440`); }
  await browser.close();
}
// pristine-empty
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  for (const k of KINDS) {
    await page.route(`**/${k}?**`, (route) => route.request().method() === "GET" ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }) }) : route.fallback());
    await go(page, `/projects/${P}/${k}`); await settle(page, 1000);
    out.errors[`empty-${k}`] = await page.evaluate(() => ({ newButtons: [...document.querySelectorAll("main button")].filter((b) => /^New /.test(b.textContent.trim())).length, h2: document.querySelector("main h2")?.textContent }));
    await shot(page, `${k}-empty__1440`);
    await page.unroute(`**/${k}?**`);
  }
  await browser.close();
}
save("shots", out);
console.log(JSON.stringify(out, null, 1));
