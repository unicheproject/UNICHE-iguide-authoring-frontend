import { open, go, rec, P, shot, ready, axe, tall } from "./h.mjs";
const S="ux-audit/round-2/audit/s11-editors/shots/";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/routes/${rec.route}`); await ready(page,1200);
const live=()=>page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean));
await page.getByRole("button",{name:/^Activate$/}).first().click(); await page.waitForTimeout(1200);
console.log("DLG:", (await page.getByRole("dialog").innerText()).replace(/\n+/g," / "));
await page.screenshot({path:S+"route-activate__confirm__1440.png"});
await page.getByRole("dialog").getByRole("button",{name:/Activate/}).last().click(); await page.waitForTimeout(3000);
console.log("live",await live(), "dialog", await page.getByRole("dialog").count());
await page.screenshot({path:S+"route-editor__active__1440.png"});
await tall(page,"route-editor__active-tall__1440");
// edit: reorder
await page.getByRole("button",{name:/Move stop 1 down|Move .*down/i}).first().click().catch(()=>console.log("nomove"));
await page.waitForTimeout(800);
await page.screenshot({path:S+"route-editor__working-copy-dirty__1440.png"});
console.log("header:", await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,500).replace(/\n+/g," / ")));
await browser.close();
