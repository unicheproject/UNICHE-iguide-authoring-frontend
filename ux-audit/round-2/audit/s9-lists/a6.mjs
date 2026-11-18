import { open, go, shot, POP, EMPTY_D, EMPTY_B, AP, problem } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const { browser, context, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
const rx = (k) => new RegExp(`:8080/iguide/api/v1/projects/[^/]+/${k}\\?`);
for (const k of kinds) {
  await go(page, `/projects/${POP}/`);
  await page.route(rx(k), (r) => r.fulfill(problem(503, "SERVICE_UNAVAILABLE")));
  await page.goto(`http://localhost:5173/projects/${POP}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForTimeout(2500);
  const t = await page.evaluate(() => ({ main: document.querySelector("main").innerText.replace(/\s+/g, " ").slice(0, 600), alerts: [...document.querySelectorAll("[role=alert]")].map((e) => e.textContent.trim().slice(0, 200)), focus: document.activeElement?.tagName + " " + (document.activeElement?.textContent ?? "").slice(0, 40) }));
  console.log(k, "503:", JSON.stringify(t));
  await shot(page, `${k}-list__error503`, "1440");
  if (k === "pois") {
    // retry works?
    await page.unroute(rx(k));
    const retry = page.getByRole("button", { name: /try again|retry/i });
    console.log(" retry buttons:", await retry.count());
    if (await retry.count()) { await retry.first().click(); await page.waitForTimeout(1500); console.log(" after retry rows:", await page.locator("tbody tr").count()); }
  } else await page.unroute(rx(k));
}
// partial failure: pois ok, categories 503
await go(page, `/projects/${POP}/`);
await page.route(rx("categories"), (r) => r.fulfill(problem(503, "SERVICE_UNAVAILABLE")));
await page.goto(`http://localhost:5173/projects/${POP}/pois`); await page.waitForTimeout(2500);
console.log("POIS with categories 503:", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 500), "rows", await page.locator("tbody tr").count());
await shot(page, "pois-list__categories-503", "1440");
await page.unroute(rx("categories"));
await page.route(rx("places"), (r) => r.fulfill(problem(403, "FORBIDDEN")));
await page.goto(`http://localhost:5173/projects/${POP}/pois`); await page.waitForTimeout(2500);
console.log("POIS with places 403:", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 500), "rows", await page.locator("tbody tr").count());
await browser.close();
