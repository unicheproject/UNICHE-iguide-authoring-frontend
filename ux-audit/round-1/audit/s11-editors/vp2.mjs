import { start, log, state } from "./lib.mjs";
for (const vp of ["768","zoom200"]) {
  const s = await start(vp); const { page } = s;
  for (const [k, p] of [["guideUrl","guide-editor"],["eventUrl","event-editor"],["catUrl","category-editor"]]) {
    await page.goto("http://localhost:5173" + state()[k]); await page.locator("main h1").first().waitFor({timeout:40000}).catch(()=>{}); await page.waitForTimeout(2500);
    log(vp, p, await page.evaluate(()=>({h1:document.querySelector("main h1")?.innerText, sw:document.documentElement.scrollWidth})));
    await s.tall(p + "-tall", vp === "768" ? 4200 : 3000);
  }
  await s.browser.close();
}
