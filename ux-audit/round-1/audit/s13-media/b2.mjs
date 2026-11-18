import { start, go, P } from "./common.mjs";
const vp = process.argv[2] ?? "1440";
const s = await start(vp); const { page } = s;
const reqs = [];
page.on("requestfinished", async r => { if (/assets|upload-limits|languages/.test(r.url())) reqs.push(r.url().replace(/.*\/api\/v1/,"")+" "+(r.timing().responseEnd|0)+"ms"); });
await go(page, `${P}/media`);
await page.waitForSelector("main ul li a", { timeout: 30000 });
await page.waitForTimeout(1000);
console.log(reqs.join("\n"));
// scroll bottom of main
await page.evaluate(()=>{const m=document.querySelector("main"); m.scrollTop=m.scrollHeight;});
await page.waitForTimeout(600);
await s.shot("library__grid-bottom");
// filters
await page.evaluate(()=>{document.querySelector("main").scrollTop=0});
await page.getByRole("button",{name:/Filters/}).click(); await page.waitForTimeout(400);
await s.shot("library__filters-open");
console.log(await page.evaluate(()=>document.querySelector("[role=dialog],[data-state=open],main [class*=popover]")?.innerText ?? [...document.querySelectorAll("fieldset")].map(f=>f.innerText).join("|")));
await page.keyboard.press("Escape");
// type filter Audio via UI
await page.getByRole("button",{name:/Filters/}).click();
await page.getByText("Audio",{exact:true}).first().click(); await page.waitForTimeout(400);
await page.keyboard.press("Escape");
await s.shot("library__filter-audio");
console.log("audio count", await page.locator("main ul li").count(), await page.evaluate(()=>document.querySelector("main nav[aria-label=Pages]")?.innerText));
// search Greek / nothing
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
await page.fill("#media-search","zzzz"); await page.waitForTimeout(500);
await s.shot("library__search-empty");
await page.fill("#media-search","frieze"); await page.waitForTimeout(500);
console.log("frieze", await page.locator("main ul li").count());
await s.shot("library__search-frieze");
await page.fill("#media-search","Παρθενώνας"); await page.waitForTimeout(500);
console.log("greek", await page.locator("main ul li").count());
await page.fill("#media-search","alt"); await page.waitForTimeout(500);
console.log("alt", await page.locator("main ul li").count());
await s.browser.close();
