import { start, go, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const main = async()=> (await page.locator("main").first().innerText()).replace(/\n+/g," | ");
await go(page, `${P}/pois`); await page.waitForSelector("tbody tr"); await page.waitForTimeout(400);
const search = page.locator("input[type=search]");
await search.fill("ακροπολη"); await page.waitForTimeout(400);
console.log("GREEK unaccented 'ακροπολη' rows:", await page.locator("tbody tr").count());
await search.fill("Παρθενώνας"); await page.waitForTimeout(400);
console.log("GREEK 'Παρθενώνας' rows:", await page.locator("tbody tr").count());
await s.shot("pois__search-greek");
await search.fill("frieze"); await page.waitForTimeout(400);
console.log("frieze rows:", await page.locator("tbody tr").count(), "hint:", (await main()).match(/Sorted[^|]*|Matches[^|]*|Clear[^|]*/)?.[0]);
await s.shot("pois__search-active");
await search.fill("101"); await page.waitForTimeout(300); console.log("code 101 rows", await page.locator("tbody tr").count());
await search.fill("");
// filters: status ACTIVE + category
await page.getByRole("button",{name:/^Filters/}).click();
await page.getByRole("radio",{name:/^ACTIVE$/i}).check({force:true}).catch(async()=>{await page.getByText("ACTIVE",{exact:true}).last().click()});
await page.waitForTimeout(300);
await s.shot("pois__filter-status-popover");
await page.getByRole("button",{name:"Done"}).click(); await page.waitForTimeout(300);
console.log("after status filter: rows", await page.locator("tbody tr").count(), "|", (await main()).match(/Active filters[^|]*\|[^|]*\|[^|]*/)?.[0], "| hint:", (await main()).match(/(Sorted|Matches|Clear)[^|]*/)?.[0]);
console.log("reorder buttons visible:", await page.getByRole("button",{name:/^Move .* up$/}).count());
await s.shot("pois__filter-active-chips");
console.log("count text:", (await main()).match(/\d+ of \d+ points of interest/)?.[0]);
// pending filter
await page.getByRole("button",{name:/^Filters/}).click();
await page.getByText("Pending changes",{exact:true}).click(); await page.waitForTimeout(300);
await page.getByRole("button",{name:"Done"}).click();
console.log("pending rows:", await page.locator("tbody tr").count());
// reload: filters persist?
await page.reload(); await page.waitForSelector("tbody tr,[role=alert]"); await page.waitForTimeout(800);
console.log("after reload rows (filters persist?):", await page.locator("tbody tr").count());
// back/forward: open editor, back
await go(page, `${P}/pois`); await page.waitForSelector("tbody tr");
await search.fill("frieze"); await page.waitForTimeout(300);
await page.locator("tbody tr a").first().click(); await page.waitForTimeout(1200);
await page.goBack(); await page.waitForSelector("tbody tr"); await page.waitForTimeout(500);
console.log("after Back: search value", JSON.stringify(await search.inputValue()), "scroll", await page.evaluate(()=>document.querySelector("main").scrollTop));
// scroll restore
await page.evaluate(()=>document.querySelector("main").scrollTo(0,3000));
await page.locator("tbody tr a").nth(30).click().catch(async()=>{});
await page.waitForTimeout(1000); await page.goBack(); await page.waitForSelector("tbody tr"); await page.waitForTimeout(600);
console.log("scroll after back from deep row:", await page.evaluate(()=>document.querySelector("main").scrollTop));
await s.browser.close();
