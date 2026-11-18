import { open, go, P, shot, settle, IDS, url, txt, routeWithStops } from "./lib.mjs";
{ const { browser, page } = await open("admin", { viewport: "1280", forcedColors:"active" });
  await routeWithStops(page);
  await page.locator("li[data-stop-row]").first().scrollIntoViewIfNeeded(); await page.evaluate(()=>window.scrollBy(0,-120));
  await shot(page,"route__stoprows__forced-colors");
  await page.getByRole("button",{name:/^Remove stop 2/}).click(); await settle(page,400); await shot(page,"route__undo__forced-colors");
  await go(page,url("guides",IDS.guide)); await settle(page,1200);
  await page.getByRole("button",{name:"Add heading"}).click(); await page.keyboard.type("Heading"); await page.getByRole("button",{name:"Add paragraph"}).click(); await shot(page,"guide__blocks__forced-colors");
  await go(page,url("events",IDS.event)); await settle(page,1200);
  await page.locator("#occ-add").click(); await settle(page,300); await page.locator("#occ-start-o-1-hour").fill("25"); await page.keyboard.press("Tab"); await page.locator("#dates").scrollIntoViewIfNeeded(); await shot(page,"event__invalid__forced-colors");
  await go(page,url("categories",IDS.category)); await settle(page,1200);
  await page.locator("#setup").scrollIntoViewIfNeeded(); await page.evaluate(()=>window.scrollBy(0,300)); await shot(page,"category__setup__forced-colors");
  await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1280", reducedMotion:"reduce" });
  await routeWithStops(page);
  await page.getByRole("button",{name:/^Remove stop 2/}).click(); await settle(page,100);
  console.log("reduced: animations right after remove:", await page.evaluate(()=>document.getAnimations().map(a=>(a.effect?.target?.tagName||"")+" "+(a.transitionProperty||a.animationName||"")+" "+a.effect.getTiming().duration)));
  await page.keyboard.press("Control+z"); await settle(page,100);
  console.log("after undo:", await page.evaluate(()=>document.getAnimations().map(a=>(a.effect?.target?.tagName||"")+" "+(a.transitionProperty||a.animationName||"")+" "+a.effect.getTiming().duration)));
  await page.getByRole("button",{name:/^Add stops/}).click(); await settle(page,60);
  console.log("dialog open anim:", await page.evaluate(()=>document.getAnimations().map(a=>(a.effect?.target?.tagName||"")+" "+(a.transitionProperty||a.animationName||"")+" "+a.effect.getTiming().duration)));
  await browser.close(); }
{ const { browser, page } = await open("admin", { viewport: "1280" });
  await routeWithStops(page);
  await page.getByRole("button",{name:/^Remove stop 2/}).click(); await settle(page,60);
  console.log("normal: animations right after remove:", await page.evaluate(()=>document.getAnimations().map(a=>(a.effect?.target?.tagName||"")+" "+(a.transitionProperty||a.animationName||"")+" "+a.effect.getTiming().duration)));
  await browser.close(); }
