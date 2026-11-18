import { open, go, P, OUT } from "./lib.mjs";
import { mock } from "./mocks.mjs";
const empty = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 1 };
const guideState = (page) => page.evaluate(() => ({ head: document.querySelector("#guide-title")?.nextElementSibling?.textContent.trim(), steps: [...document.querySelectorAll("[data-step]")].map((e) => `${e.dataset.step}:${e.dataset.state}`), end: document.querySelector("[data-testid=guide-next]")?.textContent.trim().replace(/\s+/g, " "), primaries: [...document.querySelectorAll("#main a,#main button")].filter((e) => /bg-primary(?!-)/.test(e.className) && !/forced|rounded-full/.test(e.className)).map((e) => e.textContent.trim()), ls: Object.keys(localStorage).filter((k) => k.includes("guide")).map((k) => localStorage.getItem(k)) }));
// 1 pristine
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  const rules = {};
  for (const k of ["places", "pois", "routes", "guides", "events", "categories", "assets", "maps", "floor-plans"]) rules[k] = () => empty;
  rules["navigations"] = () => [];
  await mock(page, P.emptyB, rules);
  await go(page, `/projects/${P.emptyB}`); await page.waitForSelector("#guide-title"); await page.waitForTimeout(800);
  console.log("PRISTINE", JSON.stringify(await guideState(page)));
  await page.screenshot({ path: `${OUT}pristine-1440.png` });
  await browser.close();
}
// 2 visits do not tick (Trail)
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P.trail}`); await page.waitForSelector("#guide-title"); await page.waitForTimeout(800);
  console.log("TRAIL before", JSON.stringify(await guideState(page)));
  for (const path of ["pages", "preview", "navigation", "launch"]) { await go(page, `/projects/${P.trail}/${path}`); await page.waitForTimeout(500); }
  await go(page, `/projects/${P.trail}`); await page.waitForSelector("#guide-title"); await page.waitForTimeout(800);
  console.log("TRAIL after visits", JSON.stringify(await guideState(page)));
  await page.screenshot({ path: `${OUT}trail-1440.png` });
  // dismiss and restore
  await page.getByRole("button", { name: "Dismiss guide" }).click(); await page.waitForTimeout(300);
  console.log("dismissed focus:", await page.evaluate(() => document.activeElement?.tagName + ":" + document.activeElement?.textContent.slice(0, 20)), "guide present:", await page.locator("#guide-title").count());
  await page.locator("summary", { hasText: "Project details" }).click();
  await page.screenshot({ path: `${OUT}trail-dismissed-details-1440.png` });
  await page.getByRole("button", { name: "Show the guide again" }).click(); await page.waitForTimeout(300);
  console.log("restored focus:", await page.evaluate(() => document.activeElement?.id), "guide present:", await page.locator("#guide-title").count(), "restore btn left:", await page.getByRole("button", { name: "Show the guide again" }).count());
  await browser.close();
}
