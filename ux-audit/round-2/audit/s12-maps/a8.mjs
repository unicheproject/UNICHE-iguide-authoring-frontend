import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
await run(async () => {
  const { browser, page } = await open("admin", { viewport: "1440" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps/${MAP}`);
  await page.waitForTimeout(2500);
  console.log("placed after reload", (await t(page,"#placed")).slice(0,200).replace(/\n/g," | "));
  await shot(page, "map-editor__saved-with-pins", "1440");
  // visibility
  await page.locator("#visibility").scrollIntoViewIfNeeded();
  await shot(page, "map-editor__visibility", "1440");
  console.log((await t(page,"#visibility")).slice(0,1800));
  console.log("vis checkbox sizes", await page.locator("#visibility input[type=checkbox], #visibility [role=checkbox]").evaluateAll(es=>es.slice(0,5).map(e=>{const r=e.getBoundingClientRect();return Math.round(r.width)+"x"+Math.round(r.height)})));
  await page.locator("#filter").scrollIntoViewIfNeeded();
  const hdr = page.locator("#filter").getByRole("button").first();
  await hdr.click().catch(()=>{});
  await page.waitForTimeout(400);
  await shot(page, "map-editor__filter-open", "1440");
  await page.locator("#place").scrollIntoViewIfNeeded();
  console.log("PLACE", (await t(page,"#place")).slice(0,600));
  await shot(page, "map-editor__linked-place", "1440");
  console.log("options", await page.locator("#f-placeId option").allInnerTexts());
  await axe(page,"map-editor-bottom");
  await browser.close();
});
