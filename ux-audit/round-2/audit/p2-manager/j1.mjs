import { fresh, uiSignIn, shot, CMS } from "./lib.mjs";
const { browser, page } = await fresh("1440");
await uiSignIn(page, "admin", "1440", () => {});
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const pages = ["", "/places", "/pois", "/routes", "/guides", "/events", "/categories", "/maps", "/media", "/preview", "/overview"];
const words = ["Working Copy","pending changes","Pending changes","trigger","Trigger","surface","Surface","readiness","Readiness","Template","style preset","App: Draft","Application","Active","slug","Slug","Beacon","geo-proximity","Geo-proximity","initializ","Needs translation","Featured","Exhibit code","manifest","Draft"];
for (const p of pages) {
  await page.goto(`${CMS}/projects/${P}${p}`); await page.waitForTimeout(4500);
  const r = await page.evaluate((words) => {
    const t = document.querySelector("main")?.innerText ?? "";
    const o = {}; for (const w of words) { const n = t.split(w).length - 1; if (n) o[w] = n; }
    const hints = [...document.querySelectorAll("main [aria-label^='What is'], main [aria-label^='About']")].map(e=>e.getAttribute("aria-label"));
    const titles = [...document.querySelectorAll("main [title]")].map(e=>e.getAttribute("title")).slice(0,5);
    return { o, hints, titles };
  }, words);
  console.log(p || "/dashboard", JSON.stringify(r));
}
// POI editor: open first row of a known item
await page.goto(`${CMS}/projects/${P}/pois`); await page.waitForTimeout(4000);
const first = page.locator("main a", { hasText: "Parthenon" }).first();
await first.click(); await page.waitForTimeout(5000);
await shot(page, "poi-editor__jargon-scan", "1440", false);
const r = await page.evaluate((words)=>{ const t=document.body.innerText; const o={}; for(const w of words){const n=t.split(w).length-1; if(n)o[w]=n;} return {o, hints:[...document.querySelectorAll("[aria-label^='What is']")].map(e=>e.getAttribute("aria-label")), url:location.pathname}; }, words);
console.log("POI editor", JSON.stringify(r));
console.log((await page.evaluate(()=>document.body.innerText)).replace(/\n+/g," | ").slice(0,2500));
await browser.close();
