import { session, go, P, ids, LOG, shot, ax, sleep } from "./h.mjs";
const log = LOG(process.argv[2] ?? "cat1");
for (const vp of ["1440"]) {
const { browser, page } = await session({ viewport: vp });
await go(page, P(`/categories/${ids.category}`));
await page.waitForSelector("[data-editor-primary], h1", { timeout: 20000 }); await sleep(1200);
log("blocked-reason", await page.locator("[data-blocked-reason]").allInnerTexts());
const btn = page.getByRole("button", { name: "Deactivate" }).first();
log("deactivate disabled", await btn.getAttribute("aria-disabled"), await btn.isDisabled());
await shot(page, `before-category-${vp}`);
await btn.click(); await sleep(1500);
log("dialog", await page.getByRole("dialog").count() ? await page.getByRole("dialog").innerText() : null);
log("dialog buttons", await page.getByRole("dialog").getByRole("button").allInnerTexts().catch(() => []));
await shot(page, `before-category-deactivate-${vp}`);
await browser.close();
}
