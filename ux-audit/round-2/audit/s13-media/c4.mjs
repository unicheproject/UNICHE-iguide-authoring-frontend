import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const vp = "1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${POP}/media`); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2500);
const sm = page.getByRole("button",{name:/Show \d+ more/});
await sm.scrollIntoViewIfNeeded(); await shot(page,"library__show-more-before",vp);
await sm.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(900);
console.log("after Show more focus", await focusDesc(page), "tiles", await page.locator("ul[aria-label='Media files'] > li").count(), "count", (await t(page,"main")).match(/Showing[^\n]*/)?.[0]);
console.log("status msgs", (await page.locator("[role=status],[aria-live]").allInnerTexts()).filter(x=>x.trim()));
await shot(page,"library__show-more-after",vp);
// POI editor
await go(page, `/projects/${POP}/pois`); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2000);
await page.locator("tbody a, main a[href*='/pois/']").first().click(); await page.waitForTimeout(2500);
console.log(page.url().split("/").slice(-2).join("/"));
const add = page.getByRole("button",{name:/Add image|Choose image|Add media|Add/}); console.log("add btns", await add.evaluateAll(es=>es.map(e=>e.textContent.trim())));
await browser.close();
