import { open, go, shot, P, settle } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1500);
const sc=()=>page.evaluate(()=>{const m=[...document.querySelectorAll("*")].find(e=>e.scrollTop>0&&e.scrollHeight>e.clientHeight+100); return m?m.tagName+":"+m.scrollTop:"none"});
const row=page.locator("tbody tr").nth(40); await row.scrollIntoViewIfNeeded(); await settle(page,500);
console.log("scroll before", await sc());
await row.locator("a").first().click(); await page.waitForURL(/pois\/[0-9a-f-]{36}/); await settle(page,1200);
await page.goBack(); await page.getByRole("heading",{level:1}).first().waitFor(); await settle(page,1800);
console.log("scroll after back", await sc(), "focus", await page.evaluate(()=>document.activeElement?.tagName+":"+(document.activeElement?.textContent||"").slice(0,30)));
await shot(page,"pois-list__after-back-scrolled__1440");
// filtered-empty
await go(page, `/projects/${P}/pois?status=ARCHIVED&pending=1`); await settle(page,1500);
await shot(page,"pois-list__filtered-empty__1440");
console.log("empty:", (await page.locator("main").innerText()).split("\n").filter(Boolean).slice(-8).join(" | "));
// Needs translation + lang
await go(page, `/projects/${P}/pois?needsTranslation=1`); await settle(page,1200); console.log("nt url", page.url(), (await page.locator("main").innerText()).match(/Showing[^\n]*/)?.[0]);
// Places tree collapse
await go(page, `/projects/${P}/places`); await settle(page,1500);
const toggles=page.locator("tbody tr").first().getByRole("button",{name:/collapse|expand/i}); console.log("toggle label:", await toggles.first().getAttribute("aria-label"), await toggles.first().getAttribute("aria-expanded"));
await toggles.first().click(); await settle(page,500); console.log("rows after collapse", await page.locator("tbody tr").count());
await shot(page,"places-list__collapsed__1440");
// Place menu on child: move with tree
await page.locator("tbody tr").first().getByRole("button",{name:/Actions for/}).click(); console.log("place menu:", (await page.getByRole("menu").innerText()).replace(/\n/g," | "));
await browser.close();
