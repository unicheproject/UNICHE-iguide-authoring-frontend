import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/floor-plans/3b81f75c-3a3e-45a2-9676-89f1d283457b`);
await page.waitForSelector(".plan-plane");
await page.waitForTimeout(1500);
await page.getByRole("button", { name: /^Place / }).first().click();
await page.waitForTimeout(1000);
console.log(await page.evaluate(() => {
  const bar = document.querySelector("[data-armed-bar]"); const m = document.querySelector("main");
  const mr = m.getBoundingClientRect();
  const cs = getComputedStyle(bar);
  return { pos: cs.position, bottom: cs.bottom, mainRect: [mr.top, mr.bottom], bar: bar.getBoundingClientRect().toJSON(), plane: document.querySelector(".plan-plane").getBoundingClientRect().toJSON(), parent: bar.parentElement.getBoundingClientRect().toJSON(), scrollTop: m.scrollTop, spt: getComputedStyle(m).scrollPaddingTop };
}));
await page.mouse.wheel(0, 400); await page.waitForTimeout(500);
console.log(await page.evaluate(() => { const b = document.querySelector("[data-armed-bar]").getBoundingClientRect(); const p = document.querySelector(".plan-plane").getBoundingClientRect(); return [b.top, b.bottom, p.top, p.bottom]; }));
await browser.close();
