import * as H from "./h.mjs";
const log = H.LOG("e29");
const id = H.ids.poi;
const api = (u) => u.pathname.includes("/iguide/api/");
const runs = [["768", {viewport:"768"}], ["zoom200", {viewport:"zoom200"}], ["forced", {viewport:"1280", forcedColors:"active"}], ["reduced", {viewport:"1280", reducedMotion:"reduce"}]];
for (const [name, opts] of runs) {
  const { browser, page } = await H.session(opts);
  for (const st of ["422","409","503page"]) {
    await page.unrouteAll({behavior:"ignoreErrors"});
    await H.go(page, H.P("/pois/" + id)); await H.sleep(1500);
    if (st === "503page") { await page.route(api, (r) => r.request().method()==="GET" && new RegExp(`/pois/${id}$`).test(new URL(r.request().url()).pathname) ? r.fulfill(H.problem(503,"SERVICE_UNAVAILABLE")) : r.continue()); await H.go(page, H.P("/pois/" + id)); await H.sleep(1500); }
    else {
      await page.route(api, (r) => r.request().method()==="PUT" && new RegExp(`/pois/${id}$`).test(new URL(r.request().url()).pathname) ? r.fulfill(st==="422" ? H.problem(422,"VALIDATION_ERROR",{errors:[{path:"translations.en.title",code:"TOO_LONG",message:"Title must be at most 200 characters."}]}) : H.problem(409,"VERSION_CONFLICT",{currentVersion:9})) : r.continue());
      await page.locator("#f-title").click(); await page.keyboard.press("End"); await page.keyboard.type(" z");
      await page.getByRole("button", { name: /^Save/ }).first().click(); await H.sleep(1500);
    }
    const m = await page.evaluate(() => { const a = document.querySelector("[role=alert],[role=dialog]"); const r = a?.getBoundingClientRect(); const sc = document.documentElement; const ae = document.activeElement?.getBoundingClientRect(); return { box: r && [r.x,r.y,r.width,r.height].map(Math.round), hscroll: sc.scrollWidth > sc.clientWidth, focusVisible: !!ae && ae.width>0 && ae.top>=0 && ae.bottom<=innerHeight, anims: document.getAnimations().length }; });
    log(`${name} ${st}`, m);
    await H.shot(page, `poi-editor__${st}__${name}`);
  }
  await browser.close();
}
