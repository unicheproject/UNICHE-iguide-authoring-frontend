import { open, go } from "../../../tools/session.mjs";
const D = "ux-audit/round-2/implementation/P3a/after";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const api = (name) => (u) => u.pathname.includes("/api/") && new RegExp(`/${name}(/|$)`).test(u.pathname.replace(/^.*\/api\/v1/, ""));
const { browser, page } = await open("admin", { viewport: "1440" });
const seen = [];
page.on("request", (r) => { if (r.url().includes("/api/")) seen.push(new URL(r.url()).pathname); });
await page.route(api("categories"), (r) => r.abort());
await page.route(api("places"), (r) => r.fulfill({ status: 403, contentType: "application/problem+json", body: JSON.stringify({ title: "Forbidden", status: 403, requestId: "test-req" }) }));
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(3500);
console.log("degraded rows", await page.locator("[data-row-id]").count(), "notice", await page.getByText(/could not be loaded/).count());
await page.screenshot({ path: `${D}/pois-degraded-1440.png` });
await page.getByRole("button", { name: /^New point of interest$/ }).first().click(); await page.waitForTimeout(500);
await page.screenshot({ path: `${D}/pois-degraded-create-1440.png` });
await page.keyboard.press("Escape");
await page.unrouteAll();
// load error
await page.route(api("pois"), (r) => r.fulfill({ status: 500, contentType: "application/problem+json", body: JSON.stringify({ title: "x", status: 500, requestId: "req-1" }) }));
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(3500);
await page.screenshot({ path: `${D}/pois-error-1440.png` });
console.log("error text", (await page.locator("main").innerText()).slice(0, 300).replace(/\n/g, " | "));
await page.unrouteAll();
// languages error
await page.route(api("languages"), (r) => r.fulfill({ status: 500, contentType: "application/problem+json", body: JSON.stringify({ title: "x", status: 500, requestId: "req-2" }) }));
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(3500);
await page.screenshot({ path: `${D}/pois-languages-error-1440.png` });
console.log("lang err", (await page.locator("main").innerText()).slice(0, 300).replace(/\n/g, " | "), "addLang", await page.getByText("Add a language first").count());
await browser.close();
