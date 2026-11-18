import { open, go, shot, POP, focusDesc } from "./lib.mjs";
const kinds = [["places","New place","Place"],["pois","New point of interest","POI"],["routes","New route","Route"],["guides","New guide","Guide"],["events","New event","Event"],["categories","New category","Category"]];
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
for (const [k, btn, nm] of kinds) {
  await go(page, `/projects/${POP}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor(); await page.waitForTimeout(600);
  await page.getByRole("button", { name: btn, exact: true }).first().click(); await page.waitForTimeout(600);
  const dlg = page.getByRole("dialog");
  await dlg.getByRole("textbox").first().fill(`UX-R2-s9 ${nm}`);
  console.log("\n==", k, "slug text (collapsed):", (await dlg.innerText()).match(/(Slug|Code):[^\n]*/)?.[0]);
  await dlg.getByRole("button", { name: /Edit (slug|code)/ }).click(); await page.waitForTimeout(300);
  const slugInput = dlg.getByLabel(/^(Slug|Code)/);
  console.log(" slug value:", await slugInput.inputValue(), "| hint:", (await dlg.innerText()).replace(/\s+/g, " ").match(/(Slug|Code)[^]*?(Cancel)/)?.[0].slice(0, 260));
  await shot(page, `create-${k}__slug-open`, "1440");
  await slugInput.fill("Bad Slug!"); 
  if (k === "routes") { /* leave setting empty to test required */ }
  await dlg.getByRole("button", { name: /create/i }).click(); await page.waitForTimeout(700);
  console.log(" invalid slug/required summary:", (await dlg.locator("[data-error-summary]").innerText().catch(() => "none")).replace(/\s+/g, " "));
  await shot(page, `create-${k}__slug-invalid`, "1440");
  await slugInput.fill(`ux-r2-s9-${nm.toLowerCase()}`);
  if (k === "routes") await dlg.getByLabel(/Setting/).selectOption({ index: 2 });
  if (k === "categories") { await dlg.getByRole("button", { name: "Create and open" }).click(); await page.waitForTimeout(500); console.log(" cat summary w/ name but no applies-to:", (await dlg.locator("[data-error-summary]").innerText().catch(() => "none")).replace(/\s+/g, " ")); await shot(page, "create-categories__applies-missing", "1440"); await dlg.getByText("Points of Interest", { exact: true }).first().click(); }
  if (k === "pois") { await dlg.getByLabel("Category").selectOption({ index: 2 }); await dlg.getByLabel("Exhibit code").fill("R2S9-001"); }
  const before = page.url();
  await dlg.getByRole("button", { name: "Create and open" }).click();
  await page.waitForURL((u) => u.toString() !== before && !/\/(places|pois|routes|guides|events|categories)(\?|$)/.test(u.toString()), { timeout: 15000 }).catch(() => console.log("  no navigation!"));
  await page.waitForTimeout(1500);
  console.log(" after-create url:", page.url().replace(POP, "P"), "| h1:", await page.getByRole("heading", { level: 1 }).first().innerText().catch(() => "?"), "| title:", await page.title(), "| focus:", await focusDesc(page));
  console.log(" toasts:", await page.locator("[role=status],[data-sonner-toast],[role=alert]").evaluateAll((e) => e.map((x) => x.textContent.trim().slice(0, 120))));
  await shot(page, `create-${k}__after-create-editor`, "1440");
}
await browser.close();
