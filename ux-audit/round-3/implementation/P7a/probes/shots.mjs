import { open, go, P, shot, save, API } from "./h.mjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url.replace("file:///", "file:///C:/").replace(/^file:\/\/\/C:\/C:/, "file:///C:") );
const out = {};
for (const vp of ["1440", "1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/media`); await page.waitForSelector("[data-media-count]"); await page.waitForTimeout(2500);
  const r = { count: await page.locator("[data-media-count]").innerText() };
  await shot(page, `grid__${vp}`);
  r.hscroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await go(page, `/projects/${P}/media?view=list`); await page.waitForSelector("tbody time", { state: "attached", timeout: 6000 }).catch(() => {}); await page.waitForTimeout(2500);
  r.list = await page.evaluate(() => ({ date: document.querySelector("tbody tr:first-child time")?.textContent, usedCells: [...document.querySelectorAll("tbody td:nth-child(4)")].map((c) => c.textContent.trim()).filter((t) => /not used|unused/i.test(t)).slice(0, 1), overflow: [...document.querySelectorAll("td")].filter((td) => td.scrollWidth > td.clientWidth + 1).length, rowH: Math.round(document.querySelector("tbody tr")?.getBoundingClientRect().height ?? 0) }));
  await shot(page, `list__${vp}`);
  if (vp === "1440" || vp === "1024") {
    await go(page, `/projects/${P}/media?type=AUDIO&alt=1`); await page.waitForTimeout(1500); await shot(page, `empty__${vp}`);
  }
  out[vp] = r;
  await browser.close();
}
// forced colours + keyboard focus on a chip removal
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/media`); await page.waitForSelector("[data-media-count]"); await page.waitForTimeout(2500);
  await shot(page, `grid-forced__1440`);
  await go(page, `/projects/${P}/media?type=AUDIO&alt=1`); await page.waitForTimeout(1500);
  await shot(page, `empty-forced__1440`);
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/media?type=AUDIO&alt=1`); await page.waitForTimeout(1500);
  const chip = page.getByRole("button", { name: "Remove filter Type: Audio" });
  await chip.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  out.chipRemove = await page.evaluate(() => { const e = document.activeElement; return { tag: e.tagName, label: e.getAttribute("aria-label") || e.getAttribute("placeholder") }; });
  await page.getByRole("button", { name: /^Remove filter/ }).first().focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  out.chipRemoveLast = await page.evaluate(() => { const e = document.activeElement; return { tag: e.tagName, label: e.getAttribute("aria-label") || e.getAttribute("placeholder") }; });
  await browser.close();
}
save("shots", out);
console.log(JSON.stringify(out, null, 1));
