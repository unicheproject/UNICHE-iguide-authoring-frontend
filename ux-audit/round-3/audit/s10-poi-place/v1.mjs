import { open, go, shot, settle, path, measure } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1500});
  await go(page, path("poiB")); await settle(page,2500);
  await page.getByRole("tab",{name:/Ελληνικά/}).click(); await settle(page,600);
  await shot(page,"poiB__greek-tab-tall__1440x1500");
  const m = await measure(page); console.log("greek scrollH", m.scrollH, m.secs.map(s=>s.split("|").slice(0,2).join("|")).join(" :: "));
  const os = page.getByRole("button",{name:/Other settings/}); console.log("other settings:", await os.count(), await os.allInnerTexts(), await os.first().getAttribute("aria-expanded"));
  await os.first().click(); await settle(page,500); await shot(page,"poiB__greek-other-settings-open__1440x1500");
  const m2 = await measure(page); console.log("greek open scrollH", m2.scrollH);
  // discard pending
  await page.getByRole("tab",{name:/English/}).click();
  await page.getByRole("button",{name:/Discard changes/}).first().click(); await settle(page,600);
  await page.getByRole("dialog").getByRole("button",{name:/Discard changes/}).click(); await settle(page,2000);
  console.log("header after discard:", (await page.locator(".editor-header").innerText()).replace(/\n/g," / "));
} finally { await browser.close(); }
