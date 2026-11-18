import { start, goEd, P, tall, place, poi } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const mk = async (title, placeLabel) => {
  await goEd(page, "/pois");
  await page.getByRole("button", { name: /new point/i }).first().click(); await page.waitForTimeout(400);
  const d = page.getByRole("dialog");
  await d.getByRole("textbox").first().fill(title);
  if (placeLabel) await d.locator("select").selectOption({ label: placeLabel }).catch(async()=>{ const o = await d.locator("select option").allInnerTexts(); const m = o.find(x=>x.includes(placeLabel)); await d.locator("select").selectOption({label:m}); });
  await d.getByRole("button", { name: /^create/i }).click();
  await page.waitForURL(/pois\/[0-9a-f-]{36}/, { timeout: 15000 }).catch(()=>{});
  await page.waitForTimeout(1500); console.log(title, page.url());
};
await mk("UX-s10-poi-place Odeon Mosaic Floor Ψηφιδωτό", "Parthenon Gallery");
await mk("UX-s10-poi-place Garden Bench", "UX-s10-poi-place");
await s.browser.close();
