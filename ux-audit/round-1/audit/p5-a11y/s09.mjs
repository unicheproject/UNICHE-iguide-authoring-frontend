import { start, go, P, API, focusInfo, tabWalk, tabTo, live, openPoi, axe } from "./common.mjs";
const s = await start("1440"); const { page } = s;
await openPoi(page, s, "edited");
// coords
await tabTo(page, /^Latitude$/);
await page.keyboard.type("37.9715"); await page.keyboard.press("Tab"); await page.keyboard.type("23.7257");
await page.waitForTimeout(600);
console.log("live after coords", JSON.stringify(await live(page)));
await s.shot("poi-editor__coords-typed");
// bad value
await page.keyboard.press("Shift+Tab"); await page.keyboard.type("123.4"); await page.keyboard.press("Tab");
await page.waitForTimeout(500);
console.log("bad lat state", await page.evaluate(()=>{const e=document.querySelector("#f-latitude, input[aria-label=Latitude]")||[...document.querySelectorAll("input")].find(i=>i.labels?.[0]?.textContent.trim()==="Latitude"); return {inv:e?.getAttribute("aria-invalid"), desc:e?.getAttribute("aria-describedby"), descText: e?.getAttribute("aria-describedby") && document.getElementById(e.getAttribute("aria-describedby").split(" ")[0])?.textContent}}));
await s.shot("poi-editor__lat-invalid");
// fix and save
await page.keyboard.press("Shift+Tab"); await page.keyboard.type("37.9715"); await page.keyboard.press("Tab");
// map group keyboard
await tabTo(page, /Site map/);
console.log("map focus", JSON.stringify(await focusInfo(page)));
await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowUp"); await page.waitForTimeout(500);
console.log("live after arrows", JSON.stringify(await live(page)));
console.log("coords now", await page.evaluate(()=>[...document.querySelectorAll("input")].filter(i=>/Latitude|Longitude/.test(i.labels?.[0]?.textContent||"")).map(i=>i.value)));
await s.shot("poi-editor__map-arrows");
// Save via shift-tab to the top: use Ctrl+S?
await page.keyboard.press("Control+s"); await page.waitForTimeout(1500);
console.log("after ctrl+s", JSON.stringify(await live(page)));
await page.evaluate(()=>{document.activeElement.blur()});
// mock 422
await page.route(/\/pois\/[0-9a-f-]+$/, async (route) => {
  if (route.request().method() === "GET") return route.continue();
  await route.fulfill({ status: 422, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "Validation failed", status: 422, code: "VALIDATION_ERROR", requestId: "req-p5-422",
    errors: [{ path: "slug", code: "INVALID_SLUG", message: "Slug is invalid." }, { path: "exhibitCode", code: "DUPLICATE", message: "Exhibit code is taken." }, { path: "translations.en.title", code: "TOO_LONG", message: "Title is too long." }, { path: "latitude", code: "RANGE", message: "Latitude must be between -90 and 90." }] }) });
});
await tabTo(page, /^Slug$/); await page.keyboard.type("x");
const save = await tabTo(page, /^Save$/, 80, "Shift+Tab"); console.log("save reached", save.presses);
await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
console.log("422 focus", JSON.stringify(await focusInfo(page)), "live", JSON.stringify(await live(page)));
await s.shot("poi-editor__422-summary");
console.log(await page.locator("main").ariaSnapshot().then(t=>t.split("\n").slice(0,40).join("\n")));
console.log(await page.evaluate(()=>{const a=document.querySelector("[role=alert], [data-error-summary], #error-summary"); return a? a.outerHTML.slice(0,1500):"no alert el"}));
console.log("axe", JSON.stringify((await axe(page,"poi-422")).map(v=>v.id+":"+v.impact+":"+v.nodes)));
await s.browser.close();
