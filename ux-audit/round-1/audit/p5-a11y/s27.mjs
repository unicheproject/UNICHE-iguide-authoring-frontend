import { start, go, P, focusInfo, tabWalk, tabTo, live, axe, seed } from "./common.mjs";
const s = await start("1440"); const { page } = s;
// errors
for (const [code, k] of [[503,"503"],[404,"404"]]) {
  await page.route(/\/pois\?|\/pois$/, async r => { if (r.request().method()!=="GET") return r.continue(); await r.fulfill({ status: code, contentType: "application/problem+json", body: JSON.stringify({type:"about:blank", title: "x", status: code, code: code===404?"NOT_FOUND":"SERVICE_UNAVAILABLE", requestId: "req-"+k}) }); });
  await go(page, P + "/pois"); await page.waitForTimeout(2500);
  console.log(k, "focus", JSON.stringify(await focusInfo(page)), "live", JSON.stringify(await live(page)));
  console.log(await page.locator("body").ariaSnapshot().then(t=>t.split("\n").slice(0,30).join("\n")));
  console.log("alerts", await page.locator("[role=alert]").count());
  await s.shot("pois__error-"+k);
  await page.unroute(/\/pois\?|\/pois$/);
}
// offline
await go(page, P + "/pois"); await page.waitForTimeout(1500);
await page.context().setOffline(true); await page.waitForTimeout(1500);
console.log("offline live", JSON.stringify(await live(page)), "banner", await page.locator("[role=alert],[role=status]").allTextContents());
await s.shot("pois__offline");
await page.context().setOffline(false);
// route editor controls
await go(page, P + `/routes/${seed.routes[0].id}`); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2500);
console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").filter(l=>/Stop|Move|position|Remove|spinbutton|combobox "?Position/i.test(l)).slice(0,24).join("\n")));
await s.shot("route-editor__top");
// map editor
await go(page, P + `/maps/${seed.maps[0].id}`); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(3000);
console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").filter(l=>/textbox|spinbutton|button|combobox|heading|checkbox/.test(l)).slice(0,60).join("\n")));
await s.shot("map-editor__top");
await s.browser.close();
