import { open, go } from "../../../tools/session.mjs";
const D = "ux-audit/round-2/implementation/P3-core/after";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
for (const vp of ["1024", "768", "zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2500);
  await page.screenshot({ path: `${D}/pois-${vp}.png` });
  const m = await page.evaluate(() => {
    const th = [...document.querySelectorAll("thead th")].map((t) => [t.textContent.trim(), Math.round(t.getBoundingClientRect().width)]);
    const dots = [...document.querySelectorAll("tbody tr:first-child ul li")].map((li) => li.getBoundingClientRect().height);
    return { th, dots, scrollW: document.documentElement.scrollWidth, innerW: innerWidth };
  });
  console.log(vp, JSON.stringify(m));
  // create dialog
  await page.getByRole("button", { name: /^New point of interest$/ }).first().click(); await page.waitForTimeout(600);
  const d = await page.evaluate(() => { const b = document.querySelector("[data-dialog-body]"); const r = b.getBoundingClientRect(); return { bodyH: Math.round(r.height), vh: innerHeight, labels: b.querySelectorAll("label").length }; });
  console.log(vp, "dialog", JSON.stringify(d));
  await page.screenshot({ path: `${D}/create-poi-${vp}.png` });
  await page.getByRole("dialog").getByRole("textbox").first().fill("Typed text");
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  await page.screenshot({ path: `${D}/create-poi-discard-${vp}.png` });
  console.log(vp, "confirm visible", await page.getByRole("dialog", { name: "Discard what you typed?" }).count());
  await browser.close();
}
const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
await go(page, `/projects/${P}/pois`); await page.waitForTimeout(2500);
await page.screenshot({ path: `${D}/pois-forced-1440.png` });
await browser.close();
