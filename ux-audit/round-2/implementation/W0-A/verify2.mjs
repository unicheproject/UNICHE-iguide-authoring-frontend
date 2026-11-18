import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const css = readFileSync(new URL("./built.css", import.meta.url), "utf8");
// The dev server was started before tailwind.config.js changed and has not reloaded it: add the freshly built CSS.
const withCss = async (page) => { await page.evaluate(() => document.querySelectorAll('style[data-vite-dev-id*="style.css"]').forEach((s) => s.remove())); await page.addStyleTag({ content: css }); await page.waitForTimeout(600); };
const icon = (page) => page.evaluate(() => [...document.querySelectorAll("button")].filter(b => b.offsetParent && !(b.textContent||"").trim()).map(b => { const r=b.getBoundingClientRect(); return `${(b.getAttribute("aria-label")||"?").slice(0,24)}:${Math.round(r.width)}x${Math.round(r.height)}`; }));
const uniq = (a) => [...new Set(a.map(x => x.replace(/^.*:/, "")))];

// 2 forced colours
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("main h1"); await withCss(page);
  await page.getByRole("button", { name: /^(New|Create|Add)/ }).first().click();
  await page.waitForTimeout(500);
  console.log("dialog border", await page.getByRole("dialog").evaluate(el => getComputedStyle(el).borderTopWidth + " " + getComputedStyle(el).borderTopColor));
  await page.screenshot({ path: "ux-audit/round-2/implementation/W0-A/after/forced__dialog__1440.png" });
  await page.keyboard.press("Escape");
  await page.locator("button[aria-label^='Actions for']").first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "ux-audit/round-2/implementation/W0-A/after/forced__menu__1440.png" });
  await page.keyboard.press("Escape");
  await go(page, `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await page.waitForSelector("main h1"); await page.waitForTimeout(1200); await withCss(page);
  await page.screenshot({ path: "ux-audit/round-2/implementation/W0-A/after/forced__poi-editor__1440.png" });
  await go(page, `/projects/${P}/preview`); await page.waitForTimeout(1500); await withCss(page);
  await page.screenshot({ path: "ux-audit/round-2/implementation/W0-A/after/forced__preview__1440.png" });
  await browser.close();
}
