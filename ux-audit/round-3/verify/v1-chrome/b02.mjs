import { open, shot, text, axe, settle, rect, fresh, CMS } from "./lib.mjs";
for (const kind of ["config","audience"]) {
  const { browser, page } = await open("admin", { viewport: "1440" });
  if (kind === "audience") await page.route("**/config.js*", r => r.fulfill({ contentType: "text/javascript", body: `window.__UNICHE_CONFIG__={AUDIENCE:"wrong-audience"};` }));
  else await page.route(/\/src\/platform\/config\.ts/, async r => { const resp = await r.fetch(); let b = await resp.text(); b = b.replace("injected.AUDIENCE || env.VITE_AUDIENCE", "undefined").replace("injected.IDP_URL || env.VITE_IDP_URL","undefined"); r.fulfill({ response: resp, body: b }); });
  await page.goto(CMS + "/"); await settle(page, 4000);
  console.log("=====", kind, page.url());
  console.log(JSON.stringify(await text(page)));
  console.log("alerts", await page.locator("[role=alert]").count(), "h1", await page.locator("h1").allInnerTexts(), "axe", await axe(page));
  console.log("buttons", await page.getByRole("button").allInnerTexts(), "links", await page.getByRole("link").allInnerTexts());
  console.log("focus", await page.evaluate(()=>document.activeElement?.tagName+" "+(document.activeElement?.innerText||"").slice(0,40)));
  await shot(page, `config-${kind}__1440`);
  await page.setViewportSize({width:640,height:360}); await shot(page, `config-${kind}__zoom200`);
  await browser.close();
}
