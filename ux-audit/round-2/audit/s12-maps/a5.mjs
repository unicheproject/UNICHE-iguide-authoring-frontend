import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
const live = (page) => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e=>e.textContent.trim()).filter(Boolean).slice(0,6));
await run(async () => {
  const { browser, page } = await open("admin", { viewport: "1440" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps/${MAP}`);
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: /Edit bounds/ }).click();
  await page.waitForTimeout(1200);
  await shot(page, "map-editor__edit-bounds", "1440");
  const hs = await page.evaluate(() => [...document.querySelectorAll(".leaflet-container [tabindex], .leaflet-container button, .leaflet-container a")].map(e=>{const r=e.getBoundingClientRect();return `${e.tagName} ${e.getAttribute("aria-label")||e.textContent.trim().slice(0,20)} tab=${e.getAttribute("tabindex")} ${Math.round(r.width)}x${Math.round(r.height)}`}));
  console.log("MAPFOCUS", hs);
  // keyboard focus first handle
  const handle = page.locator(".leaflet-container [tabindex='0'][aria-label*='corner' i]").first();
  console.log("handle count", await page.locator(".leaflet-container [tabindex='0'][aria-label*='corner' i], .leaflet-container [tabindex='0'][aria-label*='centre' i]").count());
  await handle.focus();
  const f0 = await page.locator("#f-minLatitude").inputValue();
  for (let i=0;i<3;i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowUp");
  console.log("fields", await page.locator("#f-minLatitude").inputValue(), f0, await page.locator("#f-minLongitude").inputValue());
  console.log("live", await live(page), "focus", await focusDesc(page));
  await shot(page, "map-editor__bounds-nudged", "1440");
  // typed
  for (const v of ["abc","999","12,5","1,2,3", "37.2"]) {
    const el = page.locator("#f-minLatitude"); await el.fill(v); await el.blur(); await page.waitForTimeout(500);
    const errs = await page.locator("main [id$='-error'], main p.text-destructive, main [role=alert]").allInnerTexts();
    console.log("typed", v, "=>", await el.inputValue(), JSON.stringify(errs), "overlay", await page.evaluate(()=>!!document.querySelector(".leaflet-container [data-error], .leaflet-container .error")));
    if (v==="999"||v==="12,5") await shot(page, "map-editor__bounds-typed-"+v.replace(",","c"), "1440");
  }
  // save with invalid
  await page.locator("#f-minLatitude").fill("abc"); await page.locator("#f-minLatitude").blur();
  await page.getByRole("button", { name: /^Save/ }).click().catch(e=>console.log("save click fail"));
  await page.waitForTimeout(1500);
  await shot(page, "map-editor__save-invalid", "1440");
  console.log("after save alerts", JSON.stringify(await page.locator("[role=alert]").allInnerTexts()));
  console.log("focus", await focusDesc(page));
  await browser.close();
});
