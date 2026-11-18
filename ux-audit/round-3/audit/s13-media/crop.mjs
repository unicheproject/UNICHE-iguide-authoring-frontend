import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/media?sort=name&dir=asc`); await settle(page);
await page.locator("ul[aria-label='Media files'] > li", {hasText:"meander-bo"}).first().scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
await shot(page, `lib__grid-chiprow-misaligned__1440`);
await browser.close();
