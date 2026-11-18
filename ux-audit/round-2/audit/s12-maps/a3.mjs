import { open, go, shot, POP, t, run, axe } from "./lib.mjs";
await run(async () => {
  for (const vp of ["1440","768"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps`);
  await page.getByRole("button", { name: "New map" }).click();
  await page.waitForTimeout(500);
  await page.locator("#nm-q").fill("Apollonas Naxos");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3500);
  console.log(vp, "RES", await page.getByRole("dialog").locator("ul[aria-label='Search results'] button").allInnerTexts());
  // keyboard: Tab from input
  await page.keyboard.press("Tab"); // clear button? search
  console.log("tab1", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
  await page.keyboard.press("Tab");
  console.log("tab2", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
  await page.keyboard.press("Tab");
  console.log("tab3", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
  await shot(page, "new-map__results", vp);
  const first = page.getByRole("dialog").locator("ul[aria-label='Search results'] button").first();
  await first.click();
  await page.waitForTimeout(2500);
  await shot(page, "new-map__picked", vp);
  console.log(vp, "PICKED", (await t(page,"[role=dialog]")).slice(0,1500));
  console.log("focus after pick", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
  if (vp==="1440") {
    // typed bounds invalid
    const s = page.locator("#nm-s");
    for (const v of ["abc","999","1,2,3","36,9"]) {
      await s.fill(v); await s.blur(); await page.waitForTimeout(400);
      console.log("bounds", v, JSON.stringify(await page.getByRole("dialog").locator("[id^=nm-s]").allInnerTexts()), await s.inputValue(), await page.getByRole("dialog").locator("p.text-destructive, [role=alert]").allInnerTexts());
    }
    await s.fill("999"); await s.blur(); await page.waitForTimeout(300);
    await shot(page, "new-map__bounds-invalid", vp);
    await page.getByRole("button",{name:/Reset to search/}).click().catch(()=>{});
    // name + create
    await page.locator("#nm-name").fill("UX-R2-s12 Map");
    await axe(page, "newmap-picked");
    await page.getByRole("button", { name: "Create map" }).click();
    await page.waitForTimeout(3000);
    console.log("URL after create", page.url());
    await shot(page, "map-editor__after-create", vp);
  }
  await browser.close();
  }
});
