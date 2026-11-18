import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const css = readFileSync(new URL("./built.css", import.meta.url), "utf8");
const OUT = "ux-audit/round-2/implementation/W0-A/after/";
const withCss = async (page) => { await page.evaluate(() => document.querySelectorAll('style[data-vite-dev-id*="style.css"]').forEach((s) => s.remove())); await page.addStyleTag({ content: css }); await page.waitForTimeout(400); };
const active = (page) => page.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName}${a.id ? "#" + a.id : ""} "${(a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 50)}" type=${a.type || ""}` : "null"; });
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  // a. upload dialog
  await go(page, `/projects/${P}/media`); await page.waitForSelector("main h1"); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /^Upload/ }).first().click(); await page.waitForTimeout(800);
  console.log("upload dialog first focus:", await active(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  console.log("after Esc:", await active(page));
  // b. row menu -> archive -> Esc
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("main h1"); await page.waitForTimeout(1500);
  const trig = page.locator("button[aria-label^='Actions for']").first();
  await trig.click(); await page.getByRole("menuitem", { name: /Archive/ }).click(); await page.waitForTimeout(800);
  console.log("archive dialog focus:", await active(page));
  await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  console.log("after Esc from archive dialog:", await active(page));
  // c. switcher
  await page.locator("header button", { hasText: /Switch project/ }).first().click(); await page.waitForTimeout(500);
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  console.log("after Esc from switcher:", await active(page));
  // d. restoreFocus with a removed opener
  console.log("restoreFocus removed opener ->", await page.evaluate(async () => { const { restoreFocus } = await import("/src/lib/focus.ts"); const b = document.createElement("button"); b.textContent = "x"; document.querySelector("main").append(b); b.focus(); b.remove(); restoreFocus(b); const a = document.activeElement; return a.tagName + ":" + (a.textContent||"").slice(0,30); }));
  console.log("focusAfterRemoval ->", await page.evaluate(async () => { const { focusAfterRemoval } = await import("/src/lib/focus.ts"); const ul = document.createElement("ul"); ul.innerHTML = "<li><button>a</button></li><li><button>b</button></li>"; document.querySelector("main").append(ul); ul.children[1].remove(); focusAfterRemoval(ul, 1); const a = document.activeElement.textContent; ul.remove(); return a; }));
  // f. formatter
  console.log("format:", await page.evaluate(async () => { const f = await import("/src/lib/format.ts"); return [f.formatDate("2026-09-04T10:05:00Z"), f.formatTime("2026-11-16T14:05:00Z", { timeZone: "Europe/Athens" }), f.formatDateTime("2026-11-16T02:05:00Z", { timeZone: "UTC" }), f.formatDateTime("2026-11-16T14:05:00Z", "en-US"), f.formatDateTimeRange("2026-09-04T10:00:00Z", "2026-09-04T12:00:00Z", { timeZone: "UTC" }), f.formatDateTimeRange("2026-09-04T22:00:00Z", "2026-09-05T02:00:00Z", { timeZone: "UTC" }, true), f.formatDate(null)]; }));
  // toast collapse
  console.log("toast x5:", await page.evaluate(async () => { const url = performance.getEntriesByType("resource").map(e => e.name).find(n => /stores\/toast\.ts/.test(n)); const t = await import(url); for (let i = 0; i < 5; i++) t.showToast("Same failure", "Body", "error", { requestId: "r1" }); await new Promise(r => setTimeout(r, 300)); const el = [...document.querySelectorAll("strong")].filter(s => /Same failure/.test(s.textContent)); return el.length + " toast(s): " + el.map(e => e.textContent).join("|"); }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + "toast-x5__1440.png", clip: { x: 900, y: 700, width: 540, height: 200 } });
  await browser.close();
}
// e. reduced motion
{
  const { browser, page } = await open("admin", { viewport: "1440", reducedMotion: "reduce" });
  await go(page, `/projects/${P}/pois`); await page.waitForSelector("main h1");
  await page.getByRole("button", { name: /^New point of interest/ }).click(); await page.waitForTimeout(100);
  console.log("reduced motion dialog panel anim:", await page.getByRole("dialog").evaluate(el => { const c = getComputedStyle(el); return c.animationName + " " + c.animationDuration; }));
  console.log("skeleton anim:", await page.evaluate(() => { const d = document.createElement("div"); d.className = "animate-skeleton"; document.body.append(d); const c = getComputedStyle(d); const r = c.animationName; d.remove(); return r; }));
  await browser.close();
}
