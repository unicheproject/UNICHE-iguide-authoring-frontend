import { open, go, shot, log, P, fresh, focused, VIEWPORTS, CMS } from "./lib.mjs";
// 1 sign-in fresh context at several viewports
for (const vp of ["1440","1024","768","zoom200"]) {
  const { browser, page } = await fresh(vp);
  await page.goto(CMS + "/");
  await page.waitForLoadState("networkidle").catch(()=>{});
  await page.waitForTimeout(1500);
  log(vp, page.url().slice(0,80));
  await shot(page, `signin__default__${vp}`, true);
  if (vp==="1440") {
    log("title", await page.title());
    await page.keyboard.press("Tab"); log("tab1", await focused(page));
    await page.keyboard.press("Tab"); log("tab2", await focused(page));
    await shot(page, `signin__focus__1440`);
  }
  await browser.close();
}
// 2 SSO landing: delay silent-check-sso
{
  const { browser, page } = await fresh("1440");
  await page.route("**/silent-check-sso.html*", async r => { await new Promise(s=>setTimeout(s,6000)); r.continue(); });
  await page.goto(CMS + "/");
  await page.waitForTimeout(2500);
  await shot(page, "sso-landing__checking__1440");
  await browser.close();
}
// 3 sign-in clicked: redirecting state
{
  const { browser, page } = await fresh("1440");
  await page.goto(CMS + "/"); await page.waitForTimeout(2000);
  await page.route("**/realms/**/protocol/openid-connect/auth*", async r => { await new Promise(s=>setTimeout(s,4000)); r.abort(); });
  await page.getByRole("button",{name:/Sign in/}).click();
  await page.waitForTimeout(800);
  await shot(page, "signin__redirecting__1440");
  await browser.close();
}
// 4 could not start: IDP unreachable
{
  const { browser, page } = await fresh("1440");
  await page.route("**/config.js", r => r.fulfill({ contentType:"text/javascript", body:`window.__UNICHE_CONFIG__={IDP_URL:"http://localhost:9"}` }));
  await page.goto(CMS + "/"); await page.waitForTimeout(6000);
  await shot(page, "session-error__idp-unreachable__1440");
  for (const vp of ["768","zoom200"]) { await page.setViewportSize({width:VIEWPORTS[vp].width,height:VIEWPORTS[vp].height}); await shot(page, `session-error__idp-unreachable__${vp}`); }
  log("txt", await page.locator("[role=alert]").innerText().catch(e=>"none"));
  await browser.close();
}
// 5 audience missing
{
  const { browser, page } = await open("curator", {viewport:"1440"});
  await page.route("**/config.js", r => r.fulfill({ contentType:"text/javascript", body:`window.__UNICHE_CONFIG__={AUDIENCE:"nonexistent-aud"}` }));
  await page.goto(CMS + "/"); await page.waitForTimeout(4000);
  await shot(page, "session-error__no-audience__1440");
  log("txt", await page.locator("[role=alert]").innerText().catch(e=>"none"));
  log("url", page.url().slice(0,60), "header visible", await page.locator("header").count());
  await browser.close();
}
