import { open, go, shot, settle, path, measure } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1500});
  await go(page, path("place")); await settle(page,2500);
  const opts = async id => page.locator(id).evaluate(s=>[...s.options].map(o=>o.value+":"+JSON.stringify(o.textContent)).join(" | "));
  console.log("type opts:", await opts("#f-type")); console.log("map opts:", await opts("#f-link"));
  await page.locator("#f-type").selectOption({index:1}); await settle(page,500);
  console.log("type now", await page.locator("#f-type").inputValue(), "map opts:", await opts("#f-link"));
  const mo = await page.locator("#f-link option").count();
  if (mo>1) await page.locator("#f-link").selectOption({index:1}); await settle(page,1200);
  await shot(page,"place__type1-linked__1440x1500");
  console.log((await page.locator("#setup").innerText()));
  // outdoor
  await page.locator("#f-type").selectOption({index:0}); await settle(page,300);
  console.log("map opts type0:", await opts("#f-link"));
  if (await page.locator("#f-link option").count()>1) await page.locator("#f-link").selectOption({index:1}); await settle(page,1500);
  await shot(page,"place__type0-linked__1440x1500");
  // sub place
  await page.getByText("Sub-place",{exact:true}).click(); await settle(page,600);
  await shot(page,"place__subplace__1440x1500");
  console.log((await page.locator("#setup").innerText()));
  const m = await measure(page); console.log("scrollH", m.scrollH); console.log(m.secs.slice(0,3).join("\n"));
} finally { await browser.close(); }
