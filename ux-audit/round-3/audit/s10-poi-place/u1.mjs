import { open, go, shot, settle, path, measure } from "./lib2.mjs";
const foc = (page) => page.evaluate(()=>{const a=document.activeElement;return `${a.tagName}#${a.id} "${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}"`});
{
  const { browser, context, page } = await open("admin", { viewport: "1440" });
  try {
    await go(page, path("poiA")); await settle(page,2000);
    const m = await measure(page); console.log("poiA draft (QR+geo triggers) scrollH", m.scrollH, m.secs.slice(0,5).map(s=>s.split("|").slice(0,2).join("|")).join("  ::  "));
    await page.locator("#f-summary").fill("Unsaved draft text for restore test"); await page.locator("#f-title").fill("UX-R3-s10 POI Draft restored title"); await settle(page,800);
    await go(page, path("poiA")); await settle(page,2500);
    await shot(page,"poiA__restore-draft-row__1440");
    const row = await page.locator("main").innerText(); console.log("restore row:", row.match(/[^\n]*(restore|Restore)[^\n]*/g));
    const rb = page.getByRole("button",{name:/^Restore/}); console.log("restore btns", await rb.count(), await rb.allInnerTexts(), await rb.evaluateAll(b=>b.map(x=>{const r=x.getBoundingClientRect();return Math.round(r.width)+"x"+Math.round(r.height)})));
    console.log("restore container:", await page.evaluate(()=>{const b=[...document.querySelectorAll("button")].find(x=>/^Restore/.test(x.textContent.trim()));if(!b)return"";const p=b.parentElement.closest("div");const r=p.getBoundingClientRect();return `${p.textContent.trim().slice(0,160)} | h${Math.round(r.height)} y${Math.round(r.y)}`}));
    const dis = page.getByRole("button",{name:/^Discard/}); console.log("discard:", await dis.allInnerTexts());
    await rb.first().click(); await settle(page,800); console.log("after restore focus", await foc(page), "title now:", await page.locator("#f-title").inputValue());
    await shot(page,"poiA__after-restore__1440");
    // discard local draft: reload w/o saving -> leave guard? navigate directly
    await page.getByRole("button",{name:/^Discard/}).first().click().catch(()=>{});
  } finally { await browser.close(); }
}
for (const vp of ["768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  try {
    await go(page, path("poiB")); await settle(page,2000);
    await page.locator("#f-summary").click(); await page.keyboard.type(" q"); await settle(page,300);
    await page.getByRole("button",{name:/More actions/}).click(); await settle(page,500);
    console.log(vp,"more menu:", (await page.getByRole("menu").innerText()).replace(/\n/g," / "));
    await shot(page,`poiB__more-menu-dirty__${vp}`);
    await page.keyboard.press("Escape");
  } finally { await browser.close(); }
}
