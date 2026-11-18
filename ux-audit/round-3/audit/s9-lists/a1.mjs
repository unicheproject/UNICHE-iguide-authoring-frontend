import { open, go, P, shot, settle, KINDS } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of KINDS) {
  await go(page, `/projects/${P}/${k}?q=UX-R3-s9`); await settle(page, 1800);
  const rows = await page.locator("main table tbody tr").count();
  console.log("==", k, "rows for q:", rows, "url", await page.evaluate(()=>location.search));
  const tr = page.locator("main table tbody tr").first();
  const btn = tr.locator("button[aria-label^='Actions for']");
  await btn.focus(); await page.keyboard.press("Enter"); await settle(page, 400);
  await page.getByRole("menuitem", { name: /^Activate/ }).click(); await settle(page, 1200);
  const d = await page.evaluate(() => [...document.querySelectorAll("[role=dialog],[role=alertdialog]")].map(dd => ({ role: dd.getAttribute("role"), text: dd.innerText.replace(/\n+/g, " | "), btns: [...dd.querySelectorAll("button")].map(b => b.innerText.trim()), focus: document.activeElement.innerText.trim().slice(0, 30) })));
  console.log(JSON.stringify(d));
  await shot(page, `${k}__activate-dialog__1440`);
  await page.keyboard.press("Escape"); await settle(page, 500);
  console.log("after esc focus:", await page.evaluate(() => document.activeElement.getAttribute("aria-label") || document.activeElement.tagName), "dialogs", await page.locator("[role=dialog],[role=alertdialog]").count());
}
await browser.close();
