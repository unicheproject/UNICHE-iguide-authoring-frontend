import { open, go, shot, POP, t, run, axe } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await open("admin", { viewport: "1440" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  await go(page, `/projects/${POP}/maps`); await page.waitForTimeout(1500);
  await shot(page, "maps-list__default", "1440", true);
  console.log((await t(page,"main")).slice(0,2500));
  console.log("LINKS", JSON.stringify(await page.locator("main a").evaluateAll(a=>a.map(x=>x.getAttribute("href")+"|"+x.textContent.trim().slice(0,40)))));
  await go(page, `/projects/${POP}/floor-plans`); await page.waitForTimeout(1500);
  await shot(page, "plans-list__default", "1440", true);
  console.log((await t(page,"main")).slice(0,3000));
  console.log("LINKS", JSON.stringify(await page.locator("main a").evaluateAll(a=>a.map(x=>x.getAttribute("href")+"|"+x.textContent.trim().slice(0,40)))));
  await browser.close();
});
