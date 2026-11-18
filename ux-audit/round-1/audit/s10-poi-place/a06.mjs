import { start, goEd, P, tall } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await goEd(page, "/places");
const rows = await page.locator("tbody tr, [role=row]").allInnerTexts();
console.log(rows.length, rows.filter(r=>/untitled|new|UX-/i.test(r)).map(r=>r.replace(/\s+/g," ").slice(0,150)));
await page.locator("main").evaluate(m=>m.scrollTo(0,m.scrollHeight)); await page.waitForTimeout(300);
await s.shot("places-list__bottom");
await s.browser.close();
