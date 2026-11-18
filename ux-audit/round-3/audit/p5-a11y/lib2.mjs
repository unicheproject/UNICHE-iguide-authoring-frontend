import * as H from "./h.mjs";
export async function openPoi(page, name = "UX-R3-p5 POI A") {
  await H.go(page, H.P("/pois")); await page.getByRole("searchbox").fill(name); await H.sleep(900);
  await page.getByRole("link", { name }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(2200);
}
