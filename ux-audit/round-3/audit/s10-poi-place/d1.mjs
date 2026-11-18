import { open, go, shot, settle, path, measure } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await go(page, path("poiB")); await settle(page,2000);
  const m0 = await measure(page); console.log("DRAFT populated scrollH", m0.scrollH); console.log(m0.secs.join("\n"));
  await page.getByRole("button",{name:/^Activate$/}).first().click(); await settle(page,800);
  await shot(page,"poiB__activate-confirm__1440");
  const d = page.getByRole("dialog"); console.log("DIALOG:\n"+await d.innerText());
  console.log("focus:", await page.evaluate(()=>document.activeElement.tagName+":"+document.activeElement.textContent.trim().slice(0,40)));
  console.log(await d.evaluate(e=>{const r=e.getBoundingClientRect();return `dialog ${r.width}x${r.height}`}));
  await d.getByRole("button",{name:/^Activate/}).last().click(); await settle(page,3000);
  await shot(page,"poiB__active-after-activate__1440");
  console.log("focus after:", await page.evaluate(()=>document.activeElement.tagName+":"+document.activeElement.id+":"+document.activeElement.textContent.trim().slice(0,40)));
  const m = await measure(page); console.log("ACTIVE scrollH", m.scrollH);
  console.log(await page.locator("body").innerText().then(t=>t.slice(0,600)));
} finally { await browser.close(); }
