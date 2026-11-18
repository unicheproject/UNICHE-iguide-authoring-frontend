import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const live = () => page.evaluate(() => [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e => `${e.getAttribute("role")||""}/${e.getAttribute("aria-live")||""}:${(e.textContent||"").trim().slice(0,120)}`).filter(s=>!/:$/.test(s)));
await go(page, `/projects/${P}/pois`); await settle(page, 2000);
console.log("live initial", JSON.stringify(await live()));
const ths = ["Title","Status","Updated","Translations"];
for (const t of ths) {
  const b = page.locator("main thead th button", { hasText: t });
  const nm = await b.getAttribute("aria-label"); 
  for (let i = 0; i < 3; i++) {
    await b.click(); await settle(page, 700);
    const st = await page.evaluate((t) => { const th=[...document.querySelectorAll("main thead th")].find(h=>h.textContent.trim()===t); return { sort: th.getAttribute("aria-sort"), url: location.search, icon: th.querySelector("svg").getAttribute("class").match(/lucide-[a-z-]+-icon/)?.[0], first: document.querySelector("main tbody tr a").textContent.trim().slice(0,40), btnLabel: th.querySelector("button").getAttribute("aria-label"), focus: document.activeElement.textContent.trim().slice(0,20)  }; }, t);
    console.log(t, i, JSON.stringify(st), "live", JSON.stringify(await live()));
  }
}
// reset
await go(page, `/projects/${P}/pois`); await settle(page, 1500);
// sort via popover
await page.getByRole("button", { name: /Filters/ }).click(); await settle(page, 400);
const sel = page.locator("[role=dialog] select").nth(1);
await sel.selectOption({ label: "Updated" }); await settle(page, 800);
console.log("after Updated select: popover:", await page.evaluate(() => document.querySelector("[role=dialog]").innerText.replace(/\n+/g," | ")), "url", await page.evaluate(()=>location.search));
await shot(page, "pois__sort-updated-popover__1440");
console.log("live", JSON.stringify(await live()));
console.log("filter btn", await page.getByRole("button", { name: /Filters/ }).first().evaluate(e=>({label:e.getAttribute("aria-label"),text:e.innerText.replace(/\n/g,"|")})));
await page.keyboard.press("Escape"); await settle(page, 300);
await shot(page, "pois__sorted__1440");
// Title sorted: tick Featured to see filter count label
await page.getByRole("button", { name: /Filters/ }).first().click(); await settle(page, 300);
await page.locator("[role=dialog] input[type=checkbox]").nth(2).check().catch(e=>console.log("chk", e.message.slice(0,80))); await settle(page, 800);
console.log("filter btn after featured", await page.getByRole("button", { name: /Filters/ }).first().evaluate(e=>({label:e.getAttribute("aria-label"),text:e.innerText.replace(/\n/g,"|")})));
await shot(page, "pois__filtered-chips__1440");
console.log("main text", (await page.locator("main").innerText()).slice(0, 700));
await browser.close();
