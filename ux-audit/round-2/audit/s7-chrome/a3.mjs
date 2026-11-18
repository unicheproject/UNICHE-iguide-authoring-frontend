import { freshCtx, shot, run, CMS, creds } from "./lib.mjs";
await run(async () => {
  const { browser, context, page } = await freshCtx("1440");
  await page.goto(CMS + "/"); await page.waitForLoadState("networkidle").catch(()=>{});
  await page.getByRole("button",{name:/sign in/i}).first().click();
  await page.waitForURL(/\/realms\//); const c=creds("curator");
  await page.locator("#username").fill(c.user); await page.locator("#password").fill(c.password);
  const t0=Date.now(); const red=(u)=>u.replace(/(code|session_state|state|nonce|code_challenge)=[^&#]*/g,"$1=…").slice(0,150);
  page.on("request",r=>{ if(r.isNavigationRequest()||/openid-connect/.test(r.url())) console.log((Date.now()-t0)+"ms REQ "+r.method()+" "+red(r.url())+" nav="+r.isNavigationRequest()+(r.frame()!==page.mainFrame()?" [iframe]":"")); });
  page.on("response",r=>{ if(/openid-connect\/token/.test(r.url())) console.log((Date.now()-t0)+"ms RES "+r.status()+" "+r.url().slice(-40)); });
  await page.locator("#kc-login").click();
  await page.waitForURL(u=>!u.toString().includes("/realms/"));
  await page.waitForTimeout(5000); console.log("final", red(page.url())); await shot(page,"sso-landing__final","1440");
  await browser.close();
});
