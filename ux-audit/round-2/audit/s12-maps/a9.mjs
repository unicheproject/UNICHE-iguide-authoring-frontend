import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
await run(async () => {
  const { browser, page } = await open("admin", { viewport: "1440" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps/${MAP}`);
  await page.waitForTimeout(2500);
  await page.locator("#f-minLatitude").fill("37.1619");
  for (const n of ["The Horsemen of the Panathenaic Procession","Antenor Kore","Museum Shop"]) await page.getByRole("button", { name: `Place ${n} on the map` }).click();
  await page.waitForTimeout(300);
  console.log("coords", await page.locator("#placed input").evaluateAll(es=>es.map(e=>e.value)));
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForTimeout(2000);
  await page.evaluate(()=>window.scrollTo(0,0)); await page.locator("main").first().evaluate(e=>e.scrollTo?.(0,0));
  await page.waitForTimeout(500);
  await shot(page, "map-editor__pins-saved", "1440");
  // keyboard: Tab through page from name input to count stops before Save/list
  await page.locator("#f-internalName").focus();
  let stops=[]; for (let i=0;i<14;i++){ await page.keyboard.press("Tab"); stops.push(await focusDesc(page)); }
  console.log("TABS", stops);
  // nudge pin
  const pin = page.locator(".leaflet-container [aria-label^='1.']").first();
  await pin.focus();
  const before = await page.locator("#pl-0-lat").inputValue();
  await page.keyboard.press("ArrowUp"); await page.keyboard.press("ArrowUp");
  console.log("pin nudge", before, "->", await page.locator("#pl-0-lat").inputValue());
  console.log("live", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.id+":"+e.textContent.trim()).filter(x=>x.length>3)));
  // search unplaced
  await page.locator("#unplaced-search").fill("zzzz");
  await page.waitForTimeout(400);
  console.log("search none", (await t(page,"#placed")).split("Not placed")[1]?.slice(0,300));
  await shot(page, "map-editor__unplaced-empty-search", "1440");
  await browser.close();
});
