import { start, go, goEd, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await goEd(page, "/places");
await page.waitForTimeout(1000);
console.log(await page.getByRole("button").allInnerTexts().then(a=>a.filter(x=>x.trim()).slice(0,30)));
await page.getByRole("button", { name: /new place|create place|add place/i }).first().click();
await page.waitForTimeout(600);
await s.shot("create-place__open");
console.log(await page.getByRole("dialog").innerText());
// submit empty
const btns = await page.getByRole("dialog").getByRole("button").allInnerTexts(); console.log(btns);
await s.browser.close();
