import { open, go, shot, P, settle } from "./lib.mjs";
for (const vp of ["1280","1024"]) {
  const { browser, page } = await open("curator", { viewport: vp });
  await go(page, `/projects/${P}/media`); await settle(page,1500);
  await page.getByRole("button",{name:/^List$/}).click(); await settle(page,800);
  await shot(page,`media__list-view__${vp}`);
  const ov=await page.evaluate(()=>{const cells=[...document.querySelectorAll("tbody tr:nth-child(1) td, tbody tr:nth-child(4) td")]; return cells.map(c=>Math.round(c.getBoundingClientRect().width)+"w/"+c.scrollWidth+"sw")});
  console.log(vp, ov.join(" "), "docW", await page.evaluate(()=>document.documentElement.scrollWidth));
  await go(page, `/projects/${P}/media`); await settle(page,1200); await shot(page,`media__grid__${vp}`);
  await browser.close();
}
