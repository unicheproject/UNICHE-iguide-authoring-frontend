import * as H from "./h.mjs";
const log = H.LOG("a2");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/"));
  // keyboard nav to POIs via nav: tab from h1
  await page.evaluate(() => document.querySelector("h1").focus());
  const stops = [];
  for (let i = 0; i < 40; i++) { const a = (await H.tab(page, 1))[0]; stops.push(a); log("dash tab", i + 1, H.brief(a)); if (/Points of Interest/i.test(a.name) && a.tag === "a") break; }
  log("tabs to POI nav from h1:", stops.length);
  await H.shot(page, "nav__poi-focus__1440");
  await H.snap(page, "nav", "nav");
  await H.press(page, "Enter", "go POI", log, 1500);
  log("poi route", await H.title(page));
  await H.snap(page, "poi-list");
  await H.shot(page, "poi-list__load__1440");
  // tab trace from h1 to first row
  await page.evaluate(() => document.querySelector("h1").focus());
  for (let i = 0; i < 30; i++) { const a = (await H.tab(page, 1))[0]; log("poi tab", i + 1, H.brief(a)); if (a.rect[1] > 300 && /row|link/.test(a.tag + (a.role||"")) && a.tag === "a" && a.rect[0] > 300) break; }
  await H.axe(page, "poi-list", log);
} finally { await browser.close(); }
