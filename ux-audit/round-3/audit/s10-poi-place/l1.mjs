import { open, go, shot, settle, path, measure } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1500});
  await go(page, path("place")); await settle(page,2500);
  await shot(page,"place__empty-draft__1440x1500");
  const m = await measure(page); console.log("scrollH", m.scrollH); console.log(m.secs.join("\n"));
  console.log(await page.locator("main").evaluate(m=>[...m.querySelectorAll("input,select,textarea,button")].map(l=>l.tagName+"#"+l.id+"|"+(l.labels?.[0]?.textContent||l.getAttribute("aria-label")||l.textContent.trim()).slice(0,40)).join("\n")));
} finally { await browser.close(); }
