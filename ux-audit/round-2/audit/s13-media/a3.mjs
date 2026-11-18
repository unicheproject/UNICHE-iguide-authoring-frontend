import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
await go(page, `/projects/${POP}/media`);
await page.getByRole("heading", { level: 1 }).first().waitFor();
await page.waitForTimeout(2500);
const count = async () => (await page.locator("main").innerText()).match(/Showing[^\n]*/)?.[0];
await page.getByRole("checkbox",{name:/Needs translation/}).check();
const sel = page.locator("select").filter({hasText:"English"}).last();
console.log("lang options", await page.evaluate(()=>[...document.querySelectorAll("select")].map(s=>[s.id,[...s.options].map(o=>o.text).join("/")].join(":"))));
for (const v of ["Italiano","Ελληνικά"]) { await page.locator("#v-6").selectOption({label:v}); await page.waitForTimeout(500); console.log(v, await count(), page.url().split("media")[1]);}
await page.locator("#v-6").selectOption({label:"Italiano"});
await page.waitForTimeout(400);
const first = await page.evaluate(()=>[...document.querySelectorAll("ul[aria-label='Media files'] > li")].slice(0,3).map(l=>l.innerText.replace(/\n+/g," / ")));
console.log("tiles with Needs translation Italian:", first);
await shot(page,"library__filter-needs-translation-it","1440");
await page.getByRole("button",{name:/clear filters/i}).first().click();
await page.waitForTimeout(600);
console.log("after clear:", await count(), await focusDesc(page));
// sort
const sort = page.getByLabel("Sort by");
for (const v of ["Name","Type","Size","Used in","Updated"]) {
  await sort.selectOption({label:v}); await page.waitForTimeout(400);
  const names = await page.evaluate(()=>[...document.querySelectorAll("ul[aria-label='Media files'] > li")].slice(0,4).map(l=>l.innerText.split("\n").slice(0,2).join(" ")));
  console.log("sort", v, page.url().split("media")[1], JSON.stringify(names));
}
const dirBtn = page.locator("button[aria-label*='irection'], button[aria-label*='ascending'], button[aria-label*='descending']").first();
console.log("dir btn", await dirBtn.getAttribute("aria-label"), await dirBtn.getAttribute("aria-pressed"), await dirBtn.getAttribute("title"));
await dirBtn.click(); await page.waitForTimeout(400);
console.log("after dir", await dirBtn.getAttribute("aria-label"), page.url().split("media")[1], await focusDesc(page));
// Search
await page.getByPlaceholder(/Name, file name/).fill("s13");
await page.waitForTimeout(700);
console.log("search s13", await count(), page.url().split("media")[1]);
await page.getByPlaceholder(/Name, file name/).fill("Ένα");
await page.waitForTimeout(700); console.log("search greek", await count());
await page.getByPlaceholder(/Name, file name/).fill("zzzzqq");
await page.waitForTimeout(700); console.log("search none", await count());
console.log((await page.locator("main").innerText()).split("Showing")[1]?.slice(0,500).replace(/\n+/g," | "));
await shot(page,"library__search-none","1440");
// view in URL?
await page.getByPlaceholder(/Name, file name/).fill("");
await page.getByRole("button",{name:/^List/}).click(); await page.waitForTimeout(500);
console.log("list url", page.url().split("media")[1]);
await page.reload(); await page.waitForTimeout(2500);
console.log("after reload list pressed?", await page.getByRole("button",{name:/^List/}).getAttribute("aria-pressed"));
await browser.close();
