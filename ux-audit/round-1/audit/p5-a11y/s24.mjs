import { start, go, P, focusInfo, tabWalk, tabTo, live, axe } from "./common.mjs";
const POI = "/pois/22ba8181-7028-4c14-9cb2-ee091893190b";
const hs = async (page)=> page.evaluate(()=>({sx: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, mainSx: document.querySelector("main")?.scrollWidth, mainCw: document.querySelector("main")?.clientWidth}));
{ const s = await start("zoom200"); const { page } = s;
  for (const [k,p] of [["pois","/pois"],["poi-editor",POI],["preview","/preview"],["floorplan","/floor-plans/fef09ea8-f347-4742-8a34-cffc3ee87328"],["media","/media"]]) {
    await go(page, P + p); await page.getByRole("heading",{level:1}).first().waitFor().catch(()=>{}); await page.waitForTimeout(2500);
    console.log("zoom200", k, JSON.stringify(await hs(page)));
    await s.shot("zoom200__"+k);
  }
  // nav access at zoom: is there a menu button?
  console.log("nav visible at zoom", await page.locator("nav[aria-label=Primary]").isVisible(), "menu btn", await page.getByRole("button",{name:/menu/i}).count());
  await go(page, P + "/pois"); await page.waitForTimeout(1500);
  await page.getByRole("button",{name:"New point of interest"}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(600);
  await s.shot("zoom200__pois-create-dialog");
  const box = await page.locator("[role=dialog]").first().boundingBox(); console.log("dialog box at zoom", JSON.stringify(box));
  await s.browser.close(); }
{ const s = await start("1440", {forcedColors:"active"}); const { page } = s;
  for (const [k,p] of [["pois","/pois"],["poi-editor",POI],["preview","/preview"],["floorplan","/floor-plans/fef09ea8-f347-4742-8a34-cffc3ee87328"],["dashboard",""]]) {
    await go(page, P + p); await page.getByRole("heading",{level:1}).first().waitFor().catch(()=>{}); await page.waitForTimeout(2500);
    if (k==="poi-editor"){ await tabTo(page,/^Title$/); }
    if (k==="pois"){ await tabTo(page,/Filters/); await page.keyboard.press("Enter"); await page.waitForTimeout(500);}
    await s.shot("forced__"+k);
  }
  await s.browser.close(); }
