import { open, go, shot, settle, path, measure } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const foc = () => page.evaluate(()=>{const a=document.activeElement;return `${a.tagName}#${a.id} "${(a.getAttribute("aria-label")||a.textContent||"").trim().slice(0,40)}"`});
try {
  await go(page, path("poiA")); await settle(page,2000);
  await page.getByRole("button",{name:/More actions/}).click(); await settle(page,500);
  await shot(page,"poiA__more-menu__1440");
  console.log("menu:", await page.getByRole("menu").innerText(), "| focus", await foc());
  const item = page.getByRole("menuitem",{name:/Archive/}); console.log("archive items", await item.count());
  await item.first().click(); await settle(page,800);
  await shot(page,"poiA__archive-confirm__1440");
  console.log("ARCHIVE DLG:\n"+await page.getByRole("dialog").innerText());
  await page.getByRole("dialog").getByRole("button",{name:/^Archive/}).last().click(); await settle(page,2500);
  await shot(page,"poiA__archived__1440");
  console.log("focus", await foc());
  console.log(await page.locator("main").innerText().then(t=>t.slice(0,1500)));
  const m = await measure(page); console.log("ARCHIVED scrollH", m.scrollH);
  console.log("editable fields:", await page.locator("main").evaluate(m=>[...m.querySelectorAll("input,textarea,select")].map(i=>i.id+":"+(i.disabled||i.readOnly))).then(a=>a.join(" ")));
} finally { await browser.close(); }
