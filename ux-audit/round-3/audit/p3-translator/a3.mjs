import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const kinds = [["places","Places"],["pois","pois"],["routes","routes"],["guides","guides"],["events","events"],["categories","categories"]];
for (const [k] of kinds) {
  const t0 = Date.now();
  await go(page, base + "/" + k);
  await page.waitForSelector("h1");
  await page.waitForTimeout(1200);
  const fb = page.getByRole("button", { name: /filters/i }).first();
  const has = await fb.count();
  if (!has) { console.log(k, "NO FILTERS BUTTON"); continue; }
  await fb.click();
  await page.waitForTimeout(300);
  const info = await page.evaluate(()=>{
    const lbls=[...document.querySelectorAll("label,legend")].map(l=>l.innerText.trim().replace(/\s+/g," ")).filter(Boolean);
    const cbs=[...document.querySelectorAll("input[type=checkbox],[role=checkbox],[role=switch]")].map(c=>c.getAttribute("aria-label")||c.closest("label")?.innerText.trim());
    return {lbls,cbs};
  });
  console.log(k, JSON.stringify(info));
  // pick Search in = Italiano
  const sel = page.locator("select").first();
  const selCount = await page.locator("select").count();
  console.log(k, "selects", selCount);
  await shot(page, `${k}-list__filters__1440`);
  await page.keyboard.press("Escape");
}
await browser.close();
