import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1700});
  await go(page, path("poiA")); await settle(page,2500);
  await page.locator("#triggers").scrollIntoViewIfNeeded(); await settle(page,400);
  await shot(page,"poiA__triggers-state__1440x1700");
  console.log((await page.locator("#triggers").innerText()).slice(0,1500));
  console.log("header:", await page.locator(".editor-header").innerText());
  console.log(await page.locator("#triggers img, #triggers canvas, #triggers svg").evaluateAll(e=>e.slice(0,6).map(x=>x.tagName+" "+Math.round(x.getBoundingClientRect().width)+"x"+Math.round(x.getBoundingClientRect().height)+" "+(x.getAttribute("alt")||""))));
  const tp = page.getByRole("link",{name:/Test in preview/}); console.log("preview links:", await tp.count(), await tp.evaluateAll(e=>e.map(x=>x.getAttribute("href")+"|"+x.getAttribute("target"))));
} finally { await browser.close(); }
