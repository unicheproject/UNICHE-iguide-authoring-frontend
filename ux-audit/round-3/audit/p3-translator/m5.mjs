import { open, go, base, shot } from "./lib.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
// 1. Needs translation ticked without choosing Search in
await go(page, base+"/pois"); await page.waitForSelector("h1"); await page.waitForTimeout(1500);
await page.getByRole("button",{name:/filters/i}).first().click();
await page.getByRole("checkbox",{name:/needs translation/i}).click();
await page.waitForTimeout(1200);
console.log("pois tick only ->", page.url().split("?")[1], "|", await page.evaluate(()=>[...document.querySelectorAll("select")].map(s=>(s.labels?.[0]?.innerText||s.getAttribute("aria-label"))+"="+s.options[s.selectedIndex].text).join("; ")));
await shot(page,"pois-list__needs-translation-no-language__1440");
await page.keyboard.press("Escape");
// 2. Media search my asset in list view per language
for (const l of ["en","el","it"]) {
await go(page, base+`/media?view=list&lang=${l}&q=UX-R3-p3`); await page.waitForSelector("h1"); await page.waitForTimeout(2000);
console.log("media row", l, await page.evaluate(()=>{const m=document.querySelector("main"); return [...m.querySelectorAll("tbody tr, a[href*='/media/']")].filter(e=>/R3-p3/.test(e.innerText)).slice(0,1).map(e=>e.innerText.replace(/\s+/g," ")).join("")}));
}
await shot(page,"media__list-view-italian__1440");
await browser.close();
