import { open, go, P, shot, settle, IDS, url, txt } from "./h.mjs";
export * from "./h.mjs";
export async function routeWithStops(page, n=4){
  await go(page, url("routes", IDS.route)); await settle(page,1500);
  await page.getByRole("button",{name:"Add stops"}).click(); await settle(page,600);
  const d = page.getByRole("dialog");
  await d.locator("#pick-search").fill("UX-R3-s11"); await settle(page,500);
  for (let i=0;i<n;i++){ await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await settle(page,150);}
  await d.getByRole("button",{name:/^Done/}).click(); await settle(page,600);
}
