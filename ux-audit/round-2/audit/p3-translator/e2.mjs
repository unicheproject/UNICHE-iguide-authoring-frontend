import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${PID}/pois/${ids.poi}`);
await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{});
await page.waitForTimeout(1200);
const tabs = async () => (await page.locator("[role=tab]").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")))).join(" / ");
await page.getByRole("tab", { name: /Ελληνικά/ }).click();
// copy source for title
await page.getByRole("button", { name: /Copy source/ }).first().click();
console.log("title after copy:", await page.getByLabel("Title in Ελληνικά").inputValue(), "| tabs:", await tabs());
await page.getByLabel("Title in Ελληνικά").fill("UX-R2-p3 Στοά του Αττάλου – Πινακοθήκη");
await page.getByLabel("Summary in Ελληνικά").fill("Αναστηλωμένη διώροφη στοά με κιονοστοιχία που στέγαζε καταστήματα.");
console.log("tabs after summary:", await tabs());
await shot(page, "poi-editor__el-partial");
// Next missing
const nm = page.getByRole("button", { name: /Next missing/ });
console.log("next missing count", await nm.count());
if (await nm.count()) { await nm.first().scrollIntoViewIfNeeded(); await shot(page, "poi-editor__translations-card"); await nm.first().click(); await page.waitForTimeout(500);
  console.log("focused after next missing:", await page.evaluate(() => document.activeElement?.getAttribute("aria-label") || document.activeElement?.id + "|" + document.activeElement?.tagName + "|" + (document.activeElement?.labels?.[0]?.innerText||""))); }
await shot(page, "poi-editor__after-next-missing", "1440", false);
// description via keyboard Copy source (description)
await page.getByRole("button", { name: /Copy source/ }).nth(2).click();
console.log("desc copied:", (await page.getByLabel("Description in Ελληνικά").inputValue()).slice(0, 60), "| tabs:", await tabs());
await page.getByLabel("Description in Ελληνικά").fill("Η Στοά ανοικοδομήθηκε τη δεκαετία του 1950. Περπατήστε σε όλο το μήκος του ισογείου.\n\nΟ όροφος παρουσιάζει ευρήματα από τις ανασκαφές της Αγοράς.");
// practical details
const pd = page.getByRole("button", { name: /Show/ }).first();
console.log("practical show btn", await pd.count());
await pd.click().catch(()=>{});
await page.waitForTimeout(400);
await shot(page, "poi-editor__el-practical");
console.log("labels:", await page.locator("label").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")).filter(t=>/Ελληνικά|Instructions|Access/.test(t)).join(" ;; ")));
console.log("tabs:", await tabs());
// unsaved indicator
console.log("header:", (await page.locator("header, [data-editor-header]").allInnerTexts()).join("|").replace(/\n+/g," ").slice(0,300));
await browser.close();
