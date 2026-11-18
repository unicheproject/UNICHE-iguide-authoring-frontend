import { open, go, base, shot, dump } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, base + "/pois");
await page.waitForSelector("h1"); await page.waitForTimeout(1800);
const search = page.getByPlaceholder(/Search title/);
const info = async (label)=>{
 await page.waitForTimeout(1500);
 const r = await page.evaluate(()=>{
  const m=document.querySelector("main");
  const rows=[...m.querySelectorAll("tbody tr")].slice(0,4).map(tr=>tr.innerText.replace(/\s+/g," ").slice(0,200));
  const n=m.querySelectorAll("tbody tr").length;
  const hints=[...m.querySelectorAll("*")].filter(e=>e.children.length<=1&&/(Matches|Match)/.test(e.innerText||"")&&(e.innerText||"").length<120).map(e=>`${e.innerText.trim()} [dir=${e.dir||e.getAttribute("dir")} lang=${e.getAttribute("lang")||e.querySelector("[lang]")?.lang}]`).slice(0,3);
  const empty=[...m.querySelectorAll("*")].filter(e=>e.children.length===0&&/No .* match|nothing|No points/i.test(e.innerText||"")).map(e=>e.innerText).slice(0,2);
  return {n,rows,hints,empty};
 });
 console.log(label, JSON.stringify(r));
};
for (const q of ["Ζωφόρος","ζωφορος","ΖΩΦΟΡΟΣ","Παρθενώνα","παρθενωνα","Παρθ","ζωφ"]) {
 await search.fill(q);
 await info("ALL ["+q+"]");
}
await shot(page,"pois-list__search-greek-unaccented__1440");
await page.getByRole("button",{name:/filters/i}).first().click();
await page.locator("select").first().selectOption("el");
for (const q of ["ζωφορος","Ζωφόρος"]) { await search.fill(q); await info("EL ["+q+"]"); }
await shot(page,"pois-list__search-greek-search-in-el__1440");
await browser.close();
