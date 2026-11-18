import { open, go, P, shot, small } from "./lib.mjs";
const log = (...a) => console.log(...a);
const FP="d40864d1-684a-466f-819d-68fa651b7146", MAP="5eef6cab-a61e-419e-adff-053edfff9939";
for (const vp of ["1024","768"]) {
  const { browser, context, page } = await open("curator", { viewport: vp, touch: true });
  const cdp = await context.newCDPSession(page);
  const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x,y],i)=>({x,y,id:i})) });
  await go(page, `/projects/${P}/floor-plans/${FP}`); await page.waitForTimeout(2500);
  await shot(page, `floorplan-editor__top__${vp}`, true);
  log(vp, "FP SMALL", JSON.stringify((await small(page,"main")).slice(0,60)));
  log(vp, "FP buttons", await page.locator("main").getByRole("button").allTextContents().then(a=>a.map(s=>s.trim()).filter(Boolean).join(" | ")));
  // find placement area
  const img = page.locator("main img").first();
  log(vp, "imgs", await page.locator("main img").count());
  const pins = page.locator("main [data-pin], main [role=button][aria-label*=pin i], main [aria-label*=Move i]");
  log(vp, "pin-ish", await pins.count());
  await page.mouse.wheel(0, 500); await page.waitForTimeout(400); await shot(page, `floorplan-editor__scrolled-touch__${vp}`);
  // map editor
  await go(page, `/projects/${P}/maps/${MAP}`); await page.waitForTimeout(2500);
  await shot(page, `map-editor__top__${vp}`, true);
  log(vp, "MAP SMALL", JSON.stringify((await small(page,"main")).slice(0,60)));
  log(vp, "MAP buttons", await page.locator("main").getByRole("button").allTextContents().then(a=>a.map(s=>s.trim()).filter(Boolean).join(" | ")));
  await browser.close();
}
