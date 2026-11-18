import { session, go, P, ids, LOG, shot, ax, sleep } from "./h.mjs";
const log = LOG(process.argv[2] ?? "cat2");
const vps = (process.argv[3] ?? "1440").split(",");
// structural controls outside the fold, per language
const outside = (page) => page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("main input:not([type=hidden]), main select, main textarea, main button")) {
    if (!el.getClientRects().length) continue;
    
    if (/^(f-scope|f-parentCategoryId|f-code)$/.test(el.id) || el.name === "cat-icon" || el.closest("fieldset#f-icon") || el.closest('[id=f-scope]')) out.push(el.tagName + "#" + el.id + "." + (el.name || ""));
  }
  return out;
});
for (const vp of vps) {
  const { browser, page } = await session({ viewport: vp });
  await go(page, P(`/categories/${ids.category}`));
  await page.waitForSelector("h1", { timeout: 20000 }); await sleep(1200);
  log(vp, "default tab structural visible:", (await outside(page)).length);
  await go(page, P(`/categories/${ids.category}?lang=el`)); await sleep(1500);
  log(vp, "el tab structural controls visible outside the fold:", await outside(page));
  log(vp, "fold button", await page.getByRole("button", { name: /Other settings/ }).count());
  await shot(page, `category-el-closed-${vp}`);
  await page.getByRole("button", { name: /Other settings/ }).click(); await sleep(400);
  log(vp, "after open, in fold:", await page.locator("#other-settings-body input[type=radio]").count());
  await shot(page, `category-el-open-${vp}`);
  log(vp, "axe el", await ax(page));
  await browser.close();
}
