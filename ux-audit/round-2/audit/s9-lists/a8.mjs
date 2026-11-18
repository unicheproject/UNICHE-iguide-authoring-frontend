import { open, go, shot, POP, focusDesc } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const { browser, page } = await open("curator", { viewport: "1440" });
for (const k of kinds) {
  await go(page, `/projects/${POP}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(800);
  // two rows: first (active) and a draft row
  for (const idx of [0, 1, 2]) {
    const rows = page.locator("tbody tr");
    const row = rows.nth(idx);
    const st = (await row.innerText()).replace(/\s+/g, " ").slice(0, 60);
    const kb = row.getByRole("button", { name: /actions|more|menu/i }).first();
    const kbn = await row.locator("button[aria-haspopup]").count();
    if (!kbn) { console.log(k, idx, "no kebab", st); continue; }
    const b = row.locator("button[aria-haspopup]").first();
    await b.click(); await page.waitForTimeout(300);
    const items = await page.getByRole("menuitem").evaluateAll((els) => els.map((e) => e.textContent.trim() + (e.getAttribute("aria-disabled") === "true" || e.hasAttribute("data-disabled") ? " [disabled]" : "") + (e.title ? ` (title:${e.title})` : "")));
    const name = await b.getAttribute("aria-label");
    console.log(k, idx, JSON.stringify(st), "| kebab label:", name, "|", JSON.stringify(items));
    if (idx === 1) await shot(page, `${k}-list__rowmenu`, "1440");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);
    if (idx === 0) console.log("   focus after esc:", await focusDesc(page));
  }
}
await browser.close();
