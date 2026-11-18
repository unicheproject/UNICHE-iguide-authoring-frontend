import * as H from "./h.mjs";
const log = H.LOG("e28");
const { browser, page } = await H.session();
await H.go(page, H.P("/routes/" + H.ids.route)); await H.sleep(2000);
log("route buttons", await page.getByRole("button").allInnerTexts().then(a=>a.filter(x=>/stop|remove|delete|undo|add|move/i.test(x)).slice(0,12)));
await H.shot(page, "route-editor__base__1440");
const rm = page.getByRole("button", { name: /remove/i }).first();
if (await rm.count()) {
  await rm.click(); await H.sleep(900);
  log("after remove", { msgs: await H.msgs(page), undo: await page.getByRole("button", { name: /undo/i }).count(), focus: await H.AE(page), dialog: await page.getByRole("dialog").count() });
  await H.shot(page, "route-editor__stop-removed__1440");
  const cf = page.getByRole("dialog").getByRole("button", { name: /remove/i }); if (await cf.count()) { await cf.last().click(); await H.sleep(1000); log("confirmed", { msgs: await H.msgs(page), undo: await page.getByRole("button", { name: /undo/i }).count(), focus: await H.AE(page) }); await H.shot(page, "route-editor__stop-removed2__1440"); }
  // navigate away
  await page.getByRole("link", { name: "Guides", exact: true }).first().click(); await H.sleep(1500);
  log("nav away", { url: page.url().replace(H.PID,"PID"), msgs: await H.msgs(page), dialogs: await page.getByRole("dialog").count() });
  await H.shot(page, "route-editor__stop-removed-nav-away__1440");
}
await browser.close();
