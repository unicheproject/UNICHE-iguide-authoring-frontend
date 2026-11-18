import { open, go } from "../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/preview`);
await page.waitForSelector("[data-preview-toolbar]", { timeout: 40000 });
await page.waitForTimeout(1500);
for (const s of ["Web","Mobile"]) {
  await page.getByRole("tab",{name:s,exact:true}).first().click(); await page.waitForTimeout(500);
  console.log(s, await page.$$eval("#fire-trigger optgroup", gs=>gs.map(g=>g.label+": "+[...g.querySelectorAll("option")].slice(0,2).map(o=>o.value+"|"+o.textContent).join(" ; "))));
}
const fr = await page.evaluate(()=>{const f=document.querySelector("[data-preview-frame]").getBoundingClientRect();const t=document.querySelector("[data-preview-toolbar]").getBoundingClientRect();return {frameTop:f.top, toolbarH:t.height}});
console.log(fr);
await browser.close();
