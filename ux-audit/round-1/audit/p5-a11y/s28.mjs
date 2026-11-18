import { start, go, P, API, focusInfo, tabWalk, tabTo, live, axe, seed } from "./common.mjs";
const s = await start("1440"); const { page } = s;
for (const code of [503, 404, 403]) {
  const pat = (u) => u.pathname.endsWith("/pois") && u.href.includes("/api/v1/");
  await page.route(pat, async r => { if (r.request().method()!=="GET") return r.continue(); await r.fulfill({ status: code, contentType: "application/problem+json", body: JSON.stringify({type:"about:blank", title: "x", status: code, code: code===404?"NOT_FOUND":code===403?"FORBIDDEN":"SERVICE_UNAVAILABLE", requestId: "req-"+code}) }); });
  await go(page, P + "/pois"); await page.waitForTimeout(3000);
  console.log(code, "focus", JSON.stringify(await focusInfo(page)), "live", JSON.stringify(await live(page)));
  console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").slice(0,12).join("\n")));
  console.log("alerts", await page.locator("[role=alert]").allTextContents());
  await s.shot("pois__error-"+code);
  await page.unroute(pat);
}
await go(page, P + "/pois"); await page.waitForTimeout(1500);
await page.context().setOffline(true); await page.evaluate(()=>window.dispatchEvent(new Event("offline"))); await page.waitForTimeout(1500);
console.log("offline live", JSON.stringify(await live(page)), "other", await page.locator("[role=alert],[role=status],[class*=offline],[class*=banner]").allTextContents());
await s.shot("pois__offline");
await page.context().setOffline(false);
await s.browser.close();
