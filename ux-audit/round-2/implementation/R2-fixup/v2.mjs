import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
// Asset picker at zoom200, places list at 1024
{
  const { browser, page } = await open("admin", { viewport: "zoom200" });
  await go(page, `/projects/${P}/media`); await page.waitForTimeout(2500);
  const btn = page.getByRole("button", { name: /upload|add/i }).first();
  console.log("media buttons", await page.getByRole("button").allInnerTexts());
  await browser.close();
}
for (const vp of ["1024", "768"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/places`); await page.waitForTimeout(3000);
  await page.screenshot({ path: `after/places-${vp}.png` });
  await go(page, `/projects/${P}/pois`); await page.waitForTimeout(3000);
  await page.screenshot({ path: `after/pois-${vp}.png` });
  console.log(vp, "th heights", await page.evaluate(() => [...document.querySelectorAll(".list-th")].map(e => Math.round(e.getBoundingClientRect().height))));
  await browser.close();
}
