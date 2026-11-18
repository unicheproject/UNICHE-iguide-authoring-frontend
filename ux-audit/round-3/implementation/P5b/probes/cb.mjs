import { session, go, P, ids, LOG, shot, ax, sleep } from "./h.mjs";
const log = LOG(process.argv[2] ?? "cb");
const vps = (process.argv[3] ?? "1440").split(",");
for (const vp of vps) {
const { browser, page } = await session({ viewport: vp });
await go(page, P(`/events/${ids.eventEmpty}`));
await page.waitForSelector("#f-poiId", { timeout: 20000 }); await sleep(800);
const poi = page.locator("#f-poiId");
await poi.click(); await poi.fill("παρθενωνας"); await sleep(400);
log(vp, "poi accent-free 'παρθενωνας' options:", await page.locator("#f-poiId + svg + ul [role=option], ul[aria-label='point of interest choices'] [role=option]").allInnerTexts());
await poi.fill("ΠΑΡΘΕΝΩΝΑΣ"); await sleep(300);
log(vp, "upper:", await page.locator("ul[aria-label='point of interest choices'] [role=option]").count());
if (vp === "1440") await shot(page, `combobox-search-${vp}`);
await page.keyboard.press("Enter"); await sleep(300);
log(vp, "chosen value", await poi.inputValue());
// place: indentation
const place = page.locator("#f-placeId"); await place.click(); await sleep(300);
const opts = await page.locator("ul[aria-label='place choices'] [role=option] > span:first-child").evaluateAll((els) => els.map((e) => ({ t: e.textContent, pad: getComputedStyle(e).paddingInlineStart })));
log(vp, "place options (text,padding)", opts.slice(0, 6));
if (vp === "1440") await shot(page, `combobox-places-${vp}`);
await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await sleep(300);
log(vp, "closed place value", JSON.stringify(await place.inputValue()));
log(vp, "axe", await ax(page));
await browser.close();
}
