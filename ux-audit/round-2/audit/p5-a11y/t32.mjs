import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P(""), 1500);
await L.watchLive(page);
const results = [];
// client-side route changes via keyboard on nav links
for (const name of ["Places", "Points of Interest", "Routes", "Guides", "Events", "Categories", "Maps & Floor Plans", "Media", "Preview", "Dashboard"]) {
  const a = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name, exact: true });
  await a.focus(); const before = (await L.liveLog(page)).length; await k.press("Enter"); await page.waitForTimeout(1800);
  const f = await L.focus(page); const live = (await L.liveLog(page)).slice(before);
  L.log("t32", "ROUTE", name, "| title:", await page.title(), "| focus:", f, "| announced:", live.filter((x) => /loaded|Loading/.test(x)));
  if (name === "Places") await L.shot(page, "places-list__1440");
}
// Back/forward
await page.goBack(); await page.waitForTimeout(1200);
L.log("t32", "BACK ->", page.url().split("/").pop(), await page.title(), await L.focus(page));
await page.goForward(); await page.waitForTimeout(1200);
L.log("t32", "FWD ->", page.url().split("/").pop(), await page.title(), await L.focus(page));
await browser.close();
