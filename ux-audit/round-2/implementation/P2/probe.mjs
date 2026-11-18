import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5", D = "f56e8c75-94af-4c87-88c8-06cba46240a1";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}`);
await page.waitForSelector("#warnings-title");
await page.waitForTimeout(800);
const groups = await page.locator("section[aria-labelledby=warnings-title] details").count();
await page.locator("section[aria-labelledby=warnings-title] details > summary").evaluateAll((els) => els.forEach((e) => (e.parentElement.open = true)));
const rows = await page.locator("section[aria-labelledby=warnings-title] details li").count();
const texts = await page.locator("section[aria-labelledby=warnings-title] details li").allInnerTexts();
console.log("groups", groups, "rows", rows, "unique", new Set(texts).size, texts.slice(0, 4));
console.log("pending", await page.locator("section[aria-labelledby=pending-title] tbody tr").count(), await page.locator("#pending-title").locator("xpath=../..").innerText().then(t => t.split("\n").slice(-3).join(" | ")));
console.log("h1 has Active:", /active/i.test(await page.locator("main h1").innerText()));
await page.screenshot({ path: "P2/after/populated-warnings-open.png" });
// guide: drafts project
await go(page, `/projects/${D}`);
await page.waitForSelector("#guide-title");
await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("iguide.dashboard-guide")).forEach(k => localStorage.removeItem(k)));
await page.getByRole("button", { name: "Dismiss guide" }).focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
console.log("after dismiss guide", await page.locator("#guide-title").count(), "focus:", await page.evaluate(() => document.activeElement?.tagName + ":" + document.activeElement?.textContent?.slice(0, 20)));
await page.reload(); await page.waitForSelector("#status-title");
console.log("persists dismissed after reload:", await page.locator("#guide-title").count());
await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("iguide.dashboard-guide")).forEach(k => localStorage.removeItem(k)));
// skeleton + error
await page.route(`**/projects/${D}/places?**`, (r) => r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ title: "x", status: 503, detail: "Secret stack at com.x", requestId: "req-123" }) }));
await page.reload(); await page.waitForTimeout(2500);
await page.screenshot({ path: "P2/after/error-1440.png" });
console.log("error text:", (await page.locator("main [role=alert], main .alert").first().innerText().catch(() => "?")).slice(0, 200));
await page.unroute(`**/projects/${D}/places?**`);
// pristine empty
await page.route(new RegExp(`/projects/${D}/(places|pois|routes|guides|events|categories|assets|maps|floor-plans)\\?`), (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 1 }) }));
await page.reload(); await page.waitForSelector("#guide-title");
await page.screenshot({ path: "P2/after/pristine-1440.png" });
console.log("pristine steps:", await page.locator("[data-step]").evaluateAll(e => e.map(x => x.dataset.state)));
await page.locator("[data-state=next] a").click(); await page.waitForTimeout(500);
console.log("url after step1:", page.url());
await browser.close();
