import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P + "/pois"); await p.waitForTimeout(1000);
const count = async()=> (await p.getByText(/\d+ of \d+ points? of interest|\d+ points? of interest/).first().innerText().catch(()=>"?"));
console.log("initial:", await count());
const filters = p.getByRole("button",{name:/Filters/});
await filters.click(); await p.getByText("Pending changes",{exact:true}).first().click(); await p.waitForTimeout(400);
await s.shot("pois-list__filter-pending-menu-open");
await p.getByRole("button",{name:/done/i}).click(); await p.waitForTimeout(400);
console.log("pending:", await count());
await s.shot("pois-list__filter-pending");
console.log("filters button label:", await filters.innerText(), "| chips outside menu:", await p.locator("main").getByText(/pending changes/i).count());
// does Esc close menu / focus
await filters.click(); await p.getByText("All",{exact:true}).first().click();
await p.locator("select").first().selectOption({index:1}); await p.waitForTimeout(300);
console.log("cat only:", await count());
await p.locator("select").first().selectOption({index:0});
await p.getByText("Featured only").click(); await p.waitForTimeout(300);
console.log("featured:", await count());
await s.shot("pois-list__filter-featured-menu");
await p.getByText("Featured only").click();
// status
await p.getByText("Draft",{exact:true}).first().click(); await p.waitForTimeout(300);
console.log("draft:", await count());
await p.getByText("All",{exact:true}).first().click();
// search language
const sl = p.locator("select").nth(1); console.log("langs:", await sl.locator("option").allInnerTexts());
await sl.selectOption({index:2}).catch(()=>{});
await p.keyboard.press("Escape");
await p.getByPlaceholder(/Search titles/).fill("Κόρη"); await p.waitForTimeout(700);
console.log("greek search (lang idx2):", await count());
await s.shot("pois-list__search-greek");
console.log("rows:", await p.locator("main a[href*='/pois/']").allInnerTexts());
await p.getByPlaceholder(/Search titles/).fill("xyzzy"); await p.waitForTimeout(500);
await s.shot("pois-list__filtered-empty");
console.log("empty:", (await p.locator("main").innerText()).slice(0,600));
await s.browser.close();
