import { open, go, shot, POP } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const { browser, page } = await open("curator", { viewport: "1440" });
for (const k of kinds) {
  await go(page, `/projects/${POP}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForTimeout(800);
  // updated order last rows
  const url0 = page.url();
  if (k !== "places" && k !== "categories") {
    await go(page, `/projects/${POP}/${k}?sort=updated`); await page.waitForTimeout(700);
    const last = await page.evaluate(() => { const r = [...document.querySelectorAll("tbody tr")]; return [r[0], r[r.length - 1]].map((x) => (x.textContent.match(/Updated \d+ \w+ \d+/)?.[0]) + " " + (x.querySelector("a")?.textContent ?? "").slice(0, 25)); });
    console.log(k, "updated asc first/last:", JSON.stringify(last));
    await go(page, `/projects/${POP}/${k}?sort=updated&dir=desc`); await page.waitForTimeout(700);
    const l2 = await page.evaluate(() => { const r = [...document.querySelectorAll("tbody tr")]; return [r[0], r[r.length - 1]].map((x) => (x.textContent.match(/Updated \d+ \w+ \d+/)?.[0]) + " " + (x.querySelector("a")?.textContent ?? "").slice(0, 25)); });
    console.log(k, "updated dir=desc first/last:", JSON.stringify(l2), "select value", await page.getByLabel("Sort by").inputValue());
  }
  await go(page, `/projects/${POP}/${k}`); await page.waitForTimeout(500);
  const search = page.getByRole("searchbox").or(page.getByLabel("Search", { exact: true })).first();
  await search.fill("zzzzqq"); await page.waitForTimeout(800);
  const clears = await page.getByRole("button", { name: /clear/i }).evaluateAll((els) => els.map((e) => e.textContent.trim() + "@" + Math.round(e.getBoundingClientRect().top)));
  const live = await page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map((e) => `${e.getAttribute("role") ?? ""}/${e.getAttribute("aria-live") ?? ""}: "${e.textContent.trim().slice(0, 100)}"`));
  console.log(k, "FILTERED-EMPTY clears:", JSON.stringify(clears), "\n  live:", JSON.stringify(live));
  console.log("  main:", (await page.locator("main").innerText()).split("\n").filter(Boolean).slice(-12).join(" | "));
  await shot(page, `${k}-list__filtered-empty`, "1440");
  // footer
  await go(page, `/projects/${POP}/${k}`); await page.waitForTimeout(600);
  const foot = await page.evaluate(() => { const t = document.querySelector("main").innerText.split("\n").filter((l) => /Showing|of \d+|legend|Order|Draft.*Active/i.test(l)); return t.slice(-6); });
  console.log(k, "footer-ish:", JSON.stringify(foot));
}
await browser.close();
