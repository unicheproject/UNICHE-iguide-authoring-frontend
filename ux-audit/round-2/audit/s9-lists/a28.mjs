import { open, go, shot, POP, focusDesc, problem } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" }); page.setDefaultTimeout(8000);
const rxS = /:8080\/iguide\/api\/v1\/projects\/[^/]+\/places\/[^/]+\/status/;
await go(page, `/projects/${POP}/places?q=${encodeURIComponent("UX-R2-s9 Place")}`); await page.waitForTimeout(900);
await page.route(rxS, (r) => r.fulfill(problem(409, "VERSION_CONFLICT")));
await page.locator("tbody tr").first().locator("button[aria-label^='Actions for']").click();
await page.getByRole("menuitem", { name: /^Deactivate$/ }).click(); await page.waitForTimeout(600);
await page.getByRole("dialog").getByRole("button", { name: /^Deactivate/ }).click();
for (const ms of [100, 300, 600, 1200]) { await page.waitForTimeout(ms); console.log(ms, await page.evaluate(() => [...document.querySelectorAll("[data-sonner-toast],li[role],[class*=toast]")].map((e) => e.getAttribute("role") + ":" + e.textContent.trim().slice(0, 90))), await focusDesc(page)); }
await shot(page, "places-list__deactivate-409-toast", "1440");
await browser.close();
