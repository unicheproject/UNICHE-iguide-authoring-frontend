import { fresh, uiSignIn, shot, text, CMS, VIEWPORTS } from "./lib.mjs";
const acct = process.argv[2] ?? "admin";
const { browser, context, page } = await fresh("1440");
await uiSignIn(page, acct, "1440", () => {});
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5", B = "1d6971ce-6391-4da8-848e-8d7466d25128";
for (const vp of ["1440", "1280"]) {
  const v = VIEWPORTS[vp]; await page.setViewportSize({ width: v.width, height: v.height });
  for (const [nm, id] of [["populated", P], ["emptyB", B]]) {
    const t0 = Date.now();
    await page.goto(`${CMS}/projects/${id}`);
    await page.waitForSelector("main h1", { timeout: 30000 }).catch(()=>{});
    await page.waitForFunction(() => !document.querySelector("[aria-busy=true]") && /Nothing is live|block going live|Ready|Waiting|Content revision/.test(document.body.innerText), null, { timeout: 40000 }).catch(()=>console.log("content wait timed out"));
    console.log(`${nm} ${vp} content after ${Date.now()-t0}ms`);
    await page.waitForTimeout(800);
    await shot(page, `dashboard__${nm}-${acct}`, vp, false);
    await shot(page, `dashboard__${nm}-${acct}-full`, vp, true);
    if (vp === "1440") console.log(`=====${nm}\n` + await text(page, "main"));
  }
}
// home after visiting a project
await page.goto(CMS + "/"); await page.waitForTimeout(2500);
await shot(page, `home__after-project-${acct}`, "1280", false);
console.log("HOME TEXT\n" + (await text(page, "main")).slice(0, 500));
console.log("LS", await page.evaluate(() => JSON.stringify(Object.keys(localStorage))));
await browser.close();
