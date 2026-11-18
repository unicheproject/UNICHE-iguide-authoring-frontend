import { open, go, shot, wait, url, ids, active, txt, live, liveLog } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("pois", ids.poiDraft)); await wait(page, 1800);
await live(page);
await page.locator("#f-summary").fill("Summary edited v3."); await wait(page,500);
console.log("HEADER dirty:", await page.locator(".editor-header").innerText().then(t=>t.replace(/\n+/g," | ")));
console.log("Save-draft buttons:", await page.getByRole("button",{name:/Save draft/}).count(), await page.getByRole("button",{name:/Save draft/}).evaluateAll(b=>b.map(x=>{const r=x.getBoundingClientRect();return `${x.textContent.trim()} ${Math.round(r.width)}x${Math.round(r.height)} y${Math.round(r.y)}`})));
console.log("banner:", await page.locator("[class*=banner], [data-testid=working-copy-banner]").allInnerTexts());
console.log("Main texts w/ Working:", (await txt(page,"main")).match(/.{0,80}Working copy.{0,200}/i)?.[0]);
await shot(page,"poi-active__dirty__1440");
// Save and apply
const sa = page.getByRole("button",{name:/Save and apply/}); console.log("save&apply count", await sa.count());
await sa.first().click().catch(e=>console.log("nosa")); await wait(page,800);
if (await page.getByRole("dialog").count()) { console.log("APPLY DLG:", await page.getByRole("dialog").innerText().then(t=>t.replace(/\n+/g," | "))); await shot(page,"poi-active__save-and-apply-confirm__1440"); await page.keyboard.press("Escape"); await wait(page,400); console.log("focus after esc", await active(page)); }
// Save draft
await page.getByRole("button",{name:/^Save draft/}).first().click(); await wait(page,2000);
console.log("after save draft HEADER:", await page.locator(".editor-header").innerText().then(t=>t.replace(/\n+/g," | ")));
console.log("live", JSON.stringify(await liveLog(page)));
await shot(page,"poi-active__wc-saved__1440");
// dirty again then Discard
await page.locator("#f-summary").fill("Another edit"); await wait(page,300);
const disc = page.getByRole("button",{name:/Discard/}).first(); console.log("discard btns:", await page.getByRole("button",{name:/Discard/}).allInnerTexts());
await disc.click(); await wait(page,800);
if (await page.getByRole("dialog").count()) { console.log("DISCARD DLG:", await page.getByRole("dialog").innerText().then(t=>t.replace(/\n+/g," | "))); await page.getByRole("dialog").getByRole("button",{name:/Discard/}).last().click(); await wait(page,1800); }
console.log("focus after discard:", await active(page));
console.log("live", JSON.stringify(await liveLog(page)));
console.log("toast html:", await page.locator("[role=status]").evaluateAll(es=>es.map(e=>e.innerHTML.slice(0,500)).filter(h=>h.includes("iscard"))));
await shot(page,"poi-active__after-discard__1440");
await browser.close();
