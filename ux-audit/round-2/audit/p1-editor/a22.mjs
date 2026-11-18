import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
await page.getByLabel("Sort by").selectOption({label:"Updated"}); await settle(page,1000);
console.log(page.url());
const rows=async()=>page.evaluate(()=>[...document.querySelectorAll("tbody tr")].map(r=>{const t=r.innerText.replace(/\s+/g," "); return (t.match(/^.{0,40}/)[0])+" | "+(t.match(/Updated ([^·]*?\d{4})/)||[])[1]}));
let r=await rows(); console.log(r.length, r.slice(0,8).join("\n"), "...", r.slice(-4).join("\n"));
console.log(await page.locator("thead").innerText());
await shot(page,"pois-list__sort-updated__1440");console.log("sort buttons",await page.locator("button.list-sort").allInnerTexts());console.log("sort options",await page.getByLabel("Sort by").locator("option").allInnerTexts());
// click column header Title toggles?
await page.locator("button.list-sort").first().click(); await settle(page,600); console.log("after title header", page.url());
await page.locator("button.list-sort").first().click(); await settle(page,600); console.log("after 2nd", page.url(), (await rows()).slice(0,2));
console.log("aria-sort", await page.evaluate(()=>[...document.querySelectorAll("th")].map(t=>t.getAttribute("aria-sort"))));
await browser.close();
