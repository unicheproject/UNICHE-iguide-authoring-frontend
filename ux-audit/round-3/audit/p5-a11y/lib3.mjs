import * as H from "./h.mjs";
export async function openRoute(page, name = "UX-R3-p5 Route") {
  await H.go(page, H.P("/routes")); await page.getByRole("searchbox").fill(name); await H.sleep(900);
  await page.getByRole("link", { name }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(2200);
}
