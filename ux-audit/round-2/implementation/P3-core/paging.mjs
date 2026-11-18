import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
const requested = [];
await page.route(new RegExp(`/projects/${P}/pois\\?`), async (route) => {
  requested.push(new URL(route.request().url()).searchParams.get("page"));
  const response = await route.fetch(); const body = await response.json();
  if (requested.length === 1) body.totalPages = 2;
  await route.fulfill({ response, json: body });
});
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2500);
console.log("requested pages", requested, "rows", await page.locator("tbody tr").count());
await browser.close();
