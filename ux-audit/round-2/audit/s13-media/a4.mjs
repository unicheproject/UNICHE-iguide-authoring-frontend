import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
await go(page, `/projects/${POP}/media?sort=used&dir=desc`);
await page.getByRole("heading", { level: 1 }).first().waitFor();
await page.waitForTimeout(2500);
// library used counts for first 6
const rows = await page.evaluate(()=>[...document.querySelectorAll("ul[aria-label='Media files'] > li")].slice(0,8).map(l=>({t:l.innerText.replace(/\n+/g," / "), href:l.querySelector("a")?.getAttribute("href")})));
console.log(JSON.stringify(rows,null,1));
for (const r of rows.slice(0,4)) {
  await go(page, r.href);
  await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(1500);
  const main = await t(page,"main");
  const used = main.match(/Used in[\s\S]{0,300}/)?.[0].replace(/\n+/g," | ");
  console.log("EDITOR", r.t.split(" / ")[0], "\n  lib:", r.t.match(/Used in \d+|Unused/)?.[0], "\n  ed:", used);
}
await browser.close();
