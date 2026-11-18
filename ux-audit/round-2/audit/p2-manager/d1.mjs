import { fresh, uiSignIn, shot, text, CMS } from "./lib.mjs";
const { browser, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
const D = "f56e8c75-94af-4c87-88c8-06cba46240a1";
await page.goto(`${CMS}/projects/${D}`);
await page.waitForFunction(() => /Get your visitor app started|Nothing is live|Ready/.test(document.body.innerText), null, {timeout:30000}).catch(()=>console.log("no guide"));
await page.waitForTimeout(1000);
await shot(page, "emptyD__dashboard-pristine", "1440");
console.log((await text(page, "main")).slice(0,1200));
for (const [n,p] of [["places","places"],["pois","pois"]]) {
  await page.goto(`${CMS}/projects/${D}/${p}`); await page.waitForTimeout(3000);
  await shot(page, `emptyD__${n}-list-pristine`, "1440");
  console.log("==",n, (await text(page, "main")).slice(0,600));
}
await browser.close();
