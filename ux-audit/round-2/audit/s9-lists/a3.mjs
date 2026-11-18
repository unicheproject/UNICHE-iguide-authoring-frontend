import { open, go, shot, POP } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const { browser, page } = await open("curator", { viewport: "1440" });
for (const k of kinds) {
  await go(page, `/projects/${POP}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForTimeout(800);
  const sel = page.getByLabel("Sort by");
  const opts = await sel.locator("option").allTextContents();
  console.log("\n==", k, "sort options:", JSON.stringify(opts), "tag", await sel.evaluate((e) => e.tagName));
  console.log("direction control:", await page.getByRole("button", { name: /ascending|descending|direction|newest|oldest/i }).count());
  for (const o of opts.filter((x) => /Updated|Next|Title/.test(x))) {
    await sel.selectOption({ label: o });
    await page.waitForTimeout(500);
    const txt = await page.evaluate(() => [...document.querySelectorAll("tbody tr")].slice(0, 5).map((r) => (r.querySelector("a")?.textContent ?? "").trim().slice(0, 28) + " | " + (r.textContent.match(/Updated \d+ \w+ \d+|(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d+ \w+ \d+/)?.[0] ?? "")));
    console.log(" sort", o, page.url().split("?")[1], JSON.stringify(txt), "ariasort:", await page.locator("th[aria-sort]:not([aria-sort=none])").allTextContents());
  }
  // header clicking
  const th = page.locator("th button").first();
  if (await th.count()) {
    await th.click(); await page.waitForTimeout(300);
    const u1 = page.url().split("?")[1]; await th.click(); await page.waitForTimeout(300);
    const u2 = page.url().split("?")[1]; await th.click(); await page.waitForTimeout(300);
    console.log(" header click x3 urls:", u1, "|", u2, "|", page.url().split("?")[1], "label", await th.getAttribute("aria-label"), await th.innerText());
  }
}
await browser.close();
