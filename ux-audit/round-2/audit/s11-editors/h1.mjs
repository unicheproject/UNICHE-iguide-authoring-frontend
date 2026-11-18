import { open, go, rec, P, ready } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const ps = [["poi",`pois/${rec.pois[5]}`],["route",`routes/${rec.route}`],["event",`events/${rec.event}`],["guide",`guides/${rec.guide}`],["category",`categories/${rec.category}`]];
for (const [k,p] of ps) { await go(page,`/projects/${P}/${p}`); await ready(page,1200);
 console.log(k, await page.evaluate(()=>({h2:[...document.querySelectorAll("main h2")].map(e=>e.textContent.trim().slice(0,28)), req:[...document.querySelectorAll("main label")].filter(l=>/\*|required/i.test(l.textContent)).length, star:document.querySelectorAll("main [aria-required=true],main [required]").length, nav:[...document.querySelectorAll("main nav,main aside")].map(e=>e.getAttribute("aria-label")), titleHelper:(document.querySelector("main label")?.parentElement?.innerText||"").slice(0,100).replace(/\n+/g," / ")})));
}
await browser.close();
