import { session, go, P, ids, LOG, shot, sleep } from "./h.mjs";
const log = LOG("cat3");
const { browser, page } = await session({ viewport: "1440" });
for (const [name, id] of [["B active user", ids.categoryB], ["A draft user", ids.category]]) {
  await go(page, P(`/categories/${id}`)); await page.waitForSelector("h1", { timeout: 20000 }); await sleep(1500);
  const btn = page.getByRole("button", { name: /^Deactivate/ }).first();
  log(name, "aria-disabled", await btn.getAttribute("aria-disabled"), "reason:", await page.locator("[data-blocked-reason]").allInnerTexts(), "link:", await page.getByRole("button", { name: "Show where it is used" }).count());
  await shot(page, `category-deactivate-${name.replace(/ /g, "-")}`);
}
await browser.close();
