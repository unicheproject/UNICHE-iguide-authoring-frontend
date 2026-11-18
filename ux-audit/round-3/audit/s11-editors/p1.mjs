import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const [k,btn] of [["pois","New point of interest"],["routes","New route"],["guides","New guide"],["events","New event"],["categories","New category"]]) {
  await go(page, `/projects/${P}/${k}`); await settle(page);
  await page.getByRole("button",{name:/^New /}).first().click(); await settle(page,500);
  const d = page.getByRole("dialog");
  console.log(k, await d.evaluate(e=>e.innerText.replace(/\n+/g," | ").slice(0,500)));
  console.log(await d.locator("input,select,textarea,[role=combobox],[role=radio]").evaluateAll(es=>es.map(e=>e.tagName+":"+(e.id||"")+":"+(e.type||"")+":"+(e.getAttribute("aria-label")||"")).join(" ; ")));
  await shot(page, `create-${k}__1440`);
  await page.keyboard.press("Escape");
}
await browser.close();
