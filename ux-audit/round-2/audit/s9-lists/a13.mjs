import { open, go, shot, POP, focusDesc } from "./lib.mjs";
const kinds = [["places","Place"],["pois","POI"],["routes","Route"],["guides","Guide"],["events","Event"],["categories","Category"]];
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
for (const [k, nm] of kinds) {
  await go(page, `/projects/${POP}/${k}?q=${encodeURIComponent("UX-R2-s9 " + nm)}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(900);
  const rows = page.locator("tbody tr");
  console.log("\n==", k, "rows for my search:", await rows.count(), "| footer:", (await page.locator("main").innerText()).match(/Showing[^\n]*/)?.[0], "| live:", await page.locator("[role=status]").allTextContents());
  const kb = rows.first().locator("button[aria-label^='Actions for']");
  await kb.click(); await page.getByRole("menuitem", { name: "Activate" }).click(); await page.waitForTimeout(800);
  const dlg = page.getByRole("dialog");
  console.log(" ACTIVATE dialog:", (await dlg.innerText()).replace(/\s+/g, " ").slice(0, 500), "| focus:", await focusDesc(page));
  await shot(page, `${k}-list__activate-confirm`, "1440");
  await dlg.getByRole("button", { name: /^Activate/ }).last().click(); await page.waitForTimeout(2500);
  const open = await page.getByRole("dialog").count();
  console.log(" after confirm: dialog open=", open, "| url:", page.url().replace(POP, "P").slice(-40));
  if (open) {
    console.log("  dialog text:", (await page.getByRole("dialog").innerText()).replace(/\s+/g, " ").slice(0, 700), "| focus:", await focusDesc(page), "| alerts:", await page.locator("[role=alert]").allTextContents());
    await shot(page, `${k}-list__activate-refusal`, "1440");
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    console.log("  esc focus:", await focusDesc(page));
  } else {
    console.log("  toasts:", await page.locator("[role=status],[role=alert]").allTextContents());
    await shot(page, `${k}-list__activated`, "1440");
  }
}
await browser.close();
