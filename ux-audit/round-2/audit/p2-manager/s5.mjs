import { fresh, uiSignIn, shot, text, CMS } from "./lib.mjs";
const { browser, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
const B = "1d6971ce-6391-4da8-848e-8d7466d25128";
page.on("response", r => { if (/\/projects\/[0-9a-f-]{36}$/.test(r.url())) console.log("  GET project", r.status(), r.url().slice(-12)); });
page.on("requestfailed", r => console.log("  FAILED", r.url().slice(-60), r.failure()?.errorText));
for (let i = 0; i < 3; i++) {
  await page.goto(`${CMS}/projects/${B}`);
  for (const ms of [1000, 4000, 8000]) { await page.waitForTimeout(ms === 1000 ? 1000 : ms - (ms===4000?1000:4000)); console.log(`try ${i} @${ms}ms header:`, JSON.stringify((await text(page, "header")).split("\n").slice(1,3))); }
}
await page.waitForTimeout(1000);
await page.locator("summary, button").filter({ hasText: /^Project\s*1?$/ }).first().click().catch(e=>console.log("click fail"));
const grp = page.getByText("Project", { exact: true }).first();
await grp.click(); await page.waitForTimeout(500);
await shot(page, "dashboard__emptyB-project-warning-open-admin", "1440", false);
console.log((await text(page, "main")).split("Warnings")[1]?.slice(0,400));
await browser.close();
