import { open, go } from "../../../../tools/session.mjs";
const P = "/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin");
const errs = []; page.on("pageerror", e => errs.push(String(e)));
for (const r of ["pois", "media", "categories", "routes"]) {
  await go(page, P + "/" + r); await page.waitForTimeout(3000);
  await page.getByRole("button", { name: /^Filters/ }).click();
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => [...document.querySelectorAll("select")].map(s => ({ id: s.id, h: Math.round(s.getBoundingClientRect().height), w: Math.round(s.getBoundingClientRect().width) })));
  console.log(r, JSON.stringify(info));
  if (r === "media" || r === "pois") await page.screenshot({ path: `ux-audit/round-3/implementation/CLN/after/filters-${r}__1440.png` });
  await page.keyboard.press("Escape");
}
const sort = await (async () => { await go(page, P + "/pois"); await page.waitForTimeout(2500); return page.evaluate(() => [...document.querySelectorAll("select")].map(s => ({ id: s.id, h: s.getBoundingClientRect().height }))); })();
console.log("toolbar selects", JSON.stringify(sort), "pageerrors", errs.length);
await browser.close();
