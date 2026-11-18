import { start, go, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await go(page, P + "/maps"); await page.waitForTimeout(1200);
await page.getByRole("button", { name: "New map" }).first().click();
await page.waitForTimeout(800);
console.log("focus after open:", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,150)));
await s.shot("newmap__open");
// empty query
const btn = page.getByRole("button", { name: "Search", exact: true });
console.log("search disabled when empty:", await btn.isDisabled());
await page.keyboard.press("Tab"); 
// english
await page.locator("#nm-q").fill("Ancient Agora Athens");
await page.keyboard.press("Enter");
await page.waitForTimeout(3000);
await s.shot("newmap__results-en");
console.log(await page.locator("ul[aria-label^=Results] li").allInnerTexts());
// greek
await page.locator("#nm-q").fill("Αρχαία Αγορά Αθήνας");
await page.keyboard.press("Enter");
await page.waitForTimeout(3000);
await s.shot("newmap__results-el");
console.log(await page.locator("ul[aria-label^=Results] li").allInnerTexts());
// nonsense
await page.locator("#nm-q").fill("zzzqqxx nonexistent 12345");
await page.keyboard.press("Enter"); await page.waitForTimeout(2500);
await s.shot("newmap__no-results");
// network failure
await page.route("**/nominatim.openstreetmap.org/**", r => r.abort());
await page.locator("#nm-q").fill("Athens"); await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
await s.shot("newmap__search-error");
await page.unroute("**/nominatim.openstreetmap.org/**");
await page.route("**/nominatim.openstreetmap.org/**", r => r.fulfill({status:429, body:"slow down"}));
await page.locator("#nm-q").fill("Athens"); await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
console.log("429 msg:", await page.locator("[role=alert]").allInnerTexts());
await page.unroute("**/nominatim.openstreetmap.org/**");
// Esc
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
console.log("dialog after esc:", await page.locator("[role=dialog]").count(), "focus:", await page.evaluate(()=>document.activeElement?.textContent?.trim()));
await s.browser.close();
