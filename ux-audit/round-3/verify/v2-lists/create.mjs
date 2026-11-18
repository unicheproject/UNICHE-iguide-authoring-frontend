import { open, go, P, ready, shot, save, focusDesc } from "./h.mjs";
const res = {};
const { browser, page } = await open("admin", { viewport: "1440" });
const names = { places: "UX-R3V-v2 Place", pois: "UX-R3V-v2 POI", routes: "UX-R3V-v2 Route", guides: "UX-R3V-v2 Guide", events: "UX-R3V-v2 Event", categories: "UX-R3V-v2 Category" };
for (const k of Object.keys(names)) {
  await go(page, `/projects/${P}/${k}?create=1`); await ready(page);
  await page.getByRole("dialog").getByLabel(/^(Title|Name)/).first().fill(names[k]);
  if (k === "routes") await page.getByRole("dialog").getByText("Outdoor", { exact: false }).first().click();
  if (k === "categories") await page.getByRole("dialog").getByText("Points of Interest").first().click();
  await page.getByRole("button", { name: /^Create and open/ }).click();
  await page.waitForURL((u) => /\/[0-9a-f-]{36}/.test(u.pathname) , { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  res[k] = { url: page.url().replace(P, "P"), h1: await page.locator("h1").first().innerText().catch(() => null), toasts: await page.locator("[role=status],[role=alert]").allInnerTexts() };
  await shot(page, `create-${k}__landed__1440`);
}
await browser.close();
save("create", res);
console.log(JSON.stringify(res, null, 1));
