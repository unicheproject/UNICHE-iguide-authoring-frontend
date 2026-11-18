import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1800});
  await go(page, path("poiB")); await settle(page,2000);
  const ed = page.locator("main");
  await ed.getByLabel("Summary").first().fill("A short summary for the audit POI that is long enough to look like real text.");
  await ed.getByLabel("Description").first().fill("Description line one.\n\nSecond paragraph of the description, for measuring the textarea.");
  await page.getByRole("button",{name:/practical details/i}).click(); await settle(page,400);
  await shot(page,"poiB__practical-open__1440x1800"); await page.getByRole("button",{name:/^Details/}).click(); await settle(page,400); await page.locator("#f-code").fill("UXS10-1"); await page.locator("#f-minutes").fill("15");
  // place filter
  const filt = ed.getByPlaceholder(/Filter places/); await filt.fill("UX-R3-s10"); await settle(page,300);
  await shot(page,"poiB__place-filter__1440x1800");
  console.log(await ed.locator("select").evaluateAll(s=>s.map(x=>[x.id,[...x.options].map(o=>JSON.stringify(o.textContent)).slice(0,6).join(",")])));
  await page.getByRole("button",{name:/Primary image/}).click(); await settle(page,1200);
  await page.getByRole("dialog").getByText("nike-temple").click();
  await page.getByRole("button",{name:/Use this image/}).click(); await settle(page,1000);
  await page.getByRole("button",{name:/QR code/}).click(); await settle(page,500);
  await page.getByRole("button",{name:/Geo-proximity/}).click(); await settle(page,500);
  await page.getByRole("button",{name:/Beacon/}).first().click(); await settle(page,500);
  await shot(page,"poiB__filled-unsaved__1440x1800");
  console.log(await ed.evaluate(m=>[...m.querySelectorAll("input,select,textarea")].map(l=>l.id+"|"+l.type+"|"+(l.labels?.[0]?.textContent||l.getAttribute("aria-label")||"")).join("\n")));
} finally { await browser.close(); }
