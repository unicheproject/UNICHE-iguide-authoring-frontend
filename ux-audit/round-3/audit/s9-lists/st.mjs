import { open, go, P, shot, settle, KINDS } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const API = "http://localhost:8080/iguide/api/v1";
const listRe = (k) => (u) => u.toString().startsWith(API) && new RegExp(`/projects/${P}/${k}(\\?|$)`).test(u.toString());
const txt = () => page.locator("main").innerText().then(t => t.replace(/\n+/g, " | ").slice(0, 600));
for (const k of KINDS) {
  // EMPTY
  await page.route(listRe(k), async route => { const r = await route.fetch(); let j = await r.json(); if (k===KINDS[0]) console.log("shape keys", Object.keys(j).join(",")); j.content = []; j.totalElements = 0; j.totalPages = 0; j.numberOfElements = 0; j.empty = true; await route.fulfill({ response: r, json: j }); });
  await go(page, `/projects/${P}/${k}`); await settle(page, 1800);
  console.log("== EMPTY", k, await txt());
  console.log("   empty cta:", await page.evaluate(() => [...document.querySelectorAll("main button, main a")].map(b => b.innerText.trim()).filter(Boolean).slice(0, 6)));
  await shot(page, `${k}__empty__1440`);
  await page.unroute(listRe(k));
  // ERROR 500
  await page.route(listRe(k), route => route.fulfill({ status: 500, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "Internal Server Error", status: 500, detail: "NullPointerException at com.x.Secret", code: "INTERNAL", requestId: "req-r3-s9-" + k }) }));
  await go(page, `/projects/${P}/${k}`); await settle(page, 2500);
  console.log("== ERR500", k, await txt());
  console.log("   alert roles:", await page.evaluate(() => [...document.querySelectorAll("main [role=alert]")].map(a => a.innerText.replace(/\n+/g," | ").slice(0,120))), "focus", await page.evaluate(()=>document.activeElement.tagName));
  await shot(page, `${k}__error500__1440`);
  await page.unroute(listRe(k));
}
await browser.close();
