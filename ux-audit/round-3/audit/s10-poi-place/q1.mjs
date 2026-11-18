import { open, go, shot, settle, path } from "./lib2.mjs";
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  try {
    await go(page, path("poiB")); await settle(page,2000);
    await page.locator("#f-summary").click(); await page.keyboard.type(" z"); await settle(page,300);
    await shot(page,"poiB__forced-colors-dirty__1440");
    await page.getByRole("tab",{name:/Ελληνικά/}).focus(); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab"); await shot(page,"poiB__forced-colors-tabfocus__1440");
    console.log("forced matches:", await page.evaluate(()=>matchMedia("(forced-colors: active)").matches));
    // chip border / icons
    console.log(await page.evaluate(()=>[...document.querySelectorAll(".editor-header span")].filter(s=>/^(Active|Pending changes|Draft)$/.test(s.textContent.trim())).map(s=>{const c=getComputedStyle(s);return s.textContent.trim()+" border "+c.borderTopWidth+" "+c.borderTopStyle+" "+c.borderTopColor+" bg "+c.backgroundColor}).join(" | ")));
    console.log("primary btn:", await page.locator(".editor-header").getByRole("button",{name:/^Save draft$/}).evaluate(e=>{const c=getComputedStyle(e);return `bg ${c.backgroundColor} color ${c.color} border ${c.borderTopWidth} ${c.borderTopColor}`}));
  } finally { await browser.close(); }
}
{
  const { browser, page } = await open("admin", { viewport: "1440", reducedMotion: "reduce" });
  try {
    await go(page, path("poiB")); await settle(page,2000);
    await page.getByRole("button",{name:/Practical details/i}).click(); await page.waitForTimeout(60);
    console.log("RM practical anims:", await page.evaluate(()=>document.getAnimations().map(a=>a.animationName||a.transitionProperty+":"+a.effect?.getTiming().duration).join(",")));
    await page.getByRole("button",{name:/Deactivate/}).first().click(); await page.waitForTimeout(80);
    console.log("RM dialog anims:", await page.evaluate(()=>document.getAnimations().map(a=>(a.animationName||a.transitionProperty)+":"+a.effect?.getTiming().duration).join(",")));
    await page.keyboard.press("Escape");
    await page.getByRole("tab",{name:/Ελληνικά/}).click(); await page.waitForTimeout(60);
    console.log("RM tab anims:", await page.evaluate(()=>document.getAnimations().map(a=>(a.animationName||a.transitionProperty)+":"+a.effect?.getTiming().duration).join(",")));
    console.log("scroll-behavior", await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior+"/"+getComputedStyle(document.querySelector("main")).scrollBehavior));
  } finally { await browser.close(); }
}
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  try {
    await go(page, path("poiB")); await settle(page,2000);
    await page.getByRole("button",{name:/Practical details/i}).click(); await page.waitForTimeout(60);
    console.log("NM practical anims:", await page.evaluate(()=>document.getAnimations().map(a=>(a.animationName||a.transitionProperty)+":"+a.effect?.getTiming().duration).join(",")));
    await page.getByRole("button",{name:/Deactivate/}).first().click(); await page.waitForTimeout(80);
    console.log("NM dialog anims:", await page.evaluate(()=>document.getAnimations().map(a=>(a.animationName||a.transitionProperty)+":"+a.effect?.getTiming().duration).join(",")));
  } finally { await browser.close(); }
}
