import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await page.setViewportSize({width:1440,height:1500});
  await go(page, path("poiB")); await settle(page,2000);
  await page.getByRole("button",{name:/practical details/i}).click(); await settle(page,500);
  await page.getByRole("button",{name:/QR code/}).click(); await settle(page,500);
  await page.getByRole("button",{name:/Geo-proximity/}).click(); await settle(page,500);
  await page.getByRole("button",{name:/Beacon/}).first().click(); await settle(page,500);
  await page.getByRole("button",{name:/Primary image/}).click(); await settle(page,1500);
  await shot(page, `poiB__picker-open__1440x1500`);
  console.log(await page.locator("main").evaluate(m=>[...m.querySelectorAll("label,legend")].map(l=>l.textContent.trim().slice(0,50)+"|"+(l.getAttribute("for")||"")).join("\n")));
  console.log(await page.getByRole("dialog").count() && await page.getByRole("dialog").innerText());
} finally { await browser.close(); }
