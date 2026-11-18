import { open, go, shot, POP, t, run, axe } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await open("admin", { viewport: "1440" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps`);
  await page.getByRole("button", { name: "New map" }).click();
  await page.waitForTimeout(800);
  await shot(page, "new-map__open", "1440");
  console.log("DIALOG", (await t(page, "[role=dialog]")).slice(0,1500));
  console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,150)));
  await axe(page, "newmap-open");
  // empty search
  const input = page.locator("#nm-q");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await shot(page, "new-map__empty-submit", "1440");
  // error causes
  for (const [label, handler] of [["429", r=>r.fulfill({status:429, body:"Too many"})],["500", r=>r.fulfill({status:500, body:"x"})],["offline", r=>r.abort("internetdisconnected")],["empty", r=>r.fulfill({status:200, contentType:"application/json", body:"[]"})]]) {
    await page.route(/nominatim\.openstreetmap\.org/, handler);
    await input.fill("Athens "+label);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1200);
    const txt = await page.getByRole("dialog").locator("[role=alert], [role=status], .text-destructive").allInnerTexts();
    console.log("ERR", label, JSON.stringify(txt));
    await shot(page, "new-map__search-"+label, "1440");
    await page.unroute(/nominatim\.openstreetmap\.org/);
  }
  // real search
  await input.fill("Heathrow");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3500);
  await shot(page, "new-map__results-heathrow", "1440");
  console.log("RESULTS", (await t(page, "[role=dialog]")).slice(0,1500));
  await browser.close();
});
