import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
await go(page, `/projects/${POP}/media`);
await page.getByRole("heading", { level: 1 }).first().waitFor();
await page.waitForTimeout(2500);
const count = async () => (await page.locator("main").innerText()).match(/Showing[^\n]*/)?.[0];
const chipsCount = async () => page.evaluate(() => ({ chips: [...document.querySelectorAll("[aria-label='Active filters'] li")].map(e=>e.textContent.trim()), clear: [...document.querySelectorAll("button")].filter(b=>/clear filters/i.test(b.textContent)).length, alts: [...document.querySelectorAll("ul[aria-label='Media files'] li")].filter(l=>/No alt text/.test(l.innerText)).length, tiles: document.querySelectorAll("ul[aria-label='Media files'] > li").length }));
console.log("base", await count());
for (const name of ["No alt text (English)", "Unused", "Decorative"]) {
  await page.getByLabel(name, {exact:false}).first().check().catch(async()=>{ await page.getByRole("checkbox",{name}).check(); });
  await page.waitForTimeout(500);
  console.log(name, await count(), JSON.stringify(await chipsCount()), page.url().split("media")[1]);
  await shot(page, `library__filter-${name.split(" ")[0].toLowerCase()}`, "1440");
  await page.getByRole("checkbox",{name}).uncheck();
}
// needs translation
await page.getByRole("checkbox",{name:/Needs translation/}).check();
await page.waitForTimeout(500);
console.log("needs translation", await count(), page.url().split("media")[1]);
console.log((await page.locator("main").innerText()).slice(380, 800).replace(/\n+/g," | "));
await shot(page, "library__filter-needs-translation", "1440");
// combos giving empty
await page.getByRole("checkbox",{name:/Decorative/}).check();
await page.getByRole("checkbox",{name:/Unused/}).check();
await page.getByRole("checkbox",{name:"No alt text (English)"}).check();
await page.waitForTimeout(600);
console.log("combo", await count(), JSON.stringify(await chipsCount()));
console.log((await page.locator("main").innerText()).split("Showing")[1]?.slice(0,600).replace(/\n+/g," | "));
await shot(page, "library__filtered-empty", "1440");
console.log("clear buttons:", await page.getByRole("button",{name:/clear filters/i}).count());
await page.getByRole("button",{name:/clear filters/i}).first().click();
console.log("after clear focus", await focusDesc(page), await count());
await axe(page,"filters");
await browser.close();
