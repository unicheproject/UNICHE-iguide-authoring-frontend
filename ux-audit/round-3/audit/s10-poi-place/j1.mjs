import { open, go, shot, settle, path } from "./lib2.mjs";
const key=process.argv[3]??"poiB";
for (const vp of process.argv[2].split(",")) {
  const { browser, page } = await open("admin", { viewport: vp });
  try {
    await go(page, path(key)); await settle(page,2000);
    // make dirty so header shows Save and apply
    await page.locator("#f-summary").click(); await page.keyboard.press("End"); await page.keyboard.type(" x"); await settle(page,300);
    await shot(page,`${key}__active-dirty-top__${vp}`);
    const top = await page.evaluate(()=>{const q=s=>document.querySelector(s);const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return `y${Math.round(b.y)} h${Math.round(b.height)} w${Math.round(b.width)} pos ${getComputedStyle(e).position}`};
      const h1=q("h1"); return {vh:innerHeight, header:r(q(".editor-header")), banner:r(q(".editor-banner")), h1:r(h1), h1lines:Math.round(h1.getBoundingClientRect().height/parseFloat(getComputedStyle(h1).lineHeight)), appHeader:r(q("body header")), side:r(q(".side-more"))}});
    console.log(vp, JSON.stringify(top));
    await page.locator("main").evaluate(m=>m.scrollTo(0,700)); await settle(page,400);
    const sc = await page.evaluate(()=>{const q=s=>document.querySelector(s);const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return `y${Math.round(b.y)} h${Math.round(b.height)}`};return {header:r(q(".editor-header")), banner:r(q(".editor-banner")), side:r(q(".side-more")), sideScrollH:q(".side-more")?.scrollHeight, sideClient:q(".side-more")?.clientHeight}});
    console.log(vp,"scrolled700", JSON.stringify(sc));
    await shot(page,`${key}__active-dirty-scrolled__${vp}`);
    // focus textarea under sticky: tab to a field
    await page.locator("main").evaluate(m=>m.scrollTo(0,0));
    // discard local edit by reload? leave dirty -> leave guard auto
  } finally { await browser.close(); }
}
