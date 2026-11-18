import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await go(page, path("place")); await settle(page,2500);
  console.log("map value now:", await page.locator("#f-link").evaluate(s=>s.options[s.selectedIndex].textContent));
  if ((await page.locator("#f-link").inputValue())!=="") { await page.locator("#f-link").selectOption({value:""}); await settle(page,2000); await shot(page,"place__unlinked-toast__1440"); console.log("toast:", await page.locator("body").innerText().then(t=>t.match(/Unlinked[\s\S]{0,80}/)?.[0])); }
  await go(page, path("place")); await settle(page,2000);
  console.log("after reload:", await page.locator("#f-link").evaluate(s=>s.options[s.selectedIndex].textContent));
} finally { await browser.close(); }
