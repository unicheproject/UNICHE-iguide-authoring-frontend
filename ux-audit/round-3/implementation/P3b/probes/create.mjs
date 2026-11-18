import { open, go, P, settle } from "./h.mjs";
const GREEK = "Αρχαιολογικόςπεριηγητικόςοδηγόςτηςμεγάληςκαιπολύμακρύςλέξης Εκθεσιακός χώρος";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const [k, label] of [["guides", "Guide"], ["events", "Event"], ["categories", "Category"]]) {
  await go(page, `/projects/${P}/${k}?q=UX-R3-P3b`); await settle(page, 1200);
  const exists = await page.locator("[data-row-id]").count();
  if (exists) { console.log(k, "exists", exists); continue; }
  await go(page, `/projects/${P}/${k}?create=1`);
  await page.waitForSelector("[role=dialog]");
  await page.getByLabel(/^(Title|Name)/).first().fill(`UX-R3-P3b ${label} ${GREEK}`);
  if (k === "categories") await page.getByRole("radio", { name: /Points of Interest/ }).check({ force: true });
  await page.getByRole("button", { name: /Create and open/ }).click();
  await page.waitForURL(/editor|\/(guides|events|categories)\/[0-9a-f-]{36}/, { timeout: 15000 }).catch(() => {});
  await settle(page, 800);
  console.log(k, "created", page.url());
}
await browser.close();
