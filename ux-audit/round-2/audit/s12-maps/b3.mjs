import { open, go, shot, POP, run } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
await run(async () => {
  const { browser, context, page } = await open("admin", { viewport: "768", touch: true });
  await go(page, `/projects/${POP}/maps/${MAP}`);
  await page.waitForTimeout(2500);
  const cdp = await context.newCDPSession(page);
  const state = () => page.evaluate(()=>{const els=[...document.querySelectorAll("*")].filter(e=>e.scrollTop>0).map(e=>e.tagName+"."+String(e.className).slice(0,25)+":"+Math.round(e.scrollTop)); return "y="+Math.round(scrollY)+" "+els.join(",")});
  const swipe = async (x, y, dy) => {
    await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
    for (let i=1;i<=10;i++){ await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y+dy*i/10}]}); await page.waitForTimeout(16); }
    await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
    await page.waitForTimeout(700);
  };
  console.log("start", await state());
  await swipe(380, 400, -300);
  console.log("swipe over name field area", await state());
  const box = await page.locator(".leaflet-container").first().boundingBox();
  console.log("map box", JSON.stringify(box));
  const s = await state();
  await swipe(box.x+box.width/2, Math.min(box.y+box.height/2, 800), -300);
  console.log("swipe over map", await state(), "map box", JSON.stringify(await page.locator(".leaflet-container").first().boundingBox()));
  await swipe(15, 700, -300);
  console.log("swipe in 15px gutter", await state());
  await browser.close();
});
