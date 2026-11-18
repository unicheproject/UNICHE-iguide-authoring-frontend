import { open, go, P, settle, shot, focusDesc, save } from "./h.mjs";
const res = {};
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of ["pois", "routes"]) {
  await page.route(/\/categories(\?|$)/, (r) => r.abort());
  await go(page, `/projects/${P}/${k}`); await page.waitForSelector("[data-row-id]"); await settle(page, 1000);
  await page.unroute(/\/categories(\?|$)/);
  await page.getByRole("button", { name: "Try again" }).click(); await settle(page, 1200);
  res[`${k}-retry`] = { focus: await focusDesc(page), noticeGone: (await page.getByText("Categories could not be loaded").count()) === 0 };
}
save("retry", res); console.log(JSON.stringify(res));
await browser.close();
