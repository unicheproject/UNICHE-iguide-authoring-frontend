import { open, go, shot, text, axe, settle, rect, problem, P, CMS } from "./lib.mjs";
const fr = (page)=>page.evaluate(()=>{const e=document.activeElement;return e?e.tagName+" "+(e.getAttribute("aria-label")||e.innerText||"").trim().slice(0,40):null});
const cases = [

  ["project-404", 404, `/projects/${P}`],
  ["project-403", 403, `/projects/${P}`],
  ["project-502", 502, `/projects/${P}`],
  ["project-503", 503, `/projects/${P}`],
  ["project-504", 504, `/projects/${P}`],
  ["poilist-503", 503, `/projects/${P}/pois`, "pois"],
];
for (const [name, status, path, sub] of cases) {
  const { browser, page } = await open("admin", { viewport: "1440" });
  if (status) await page.route(new RegExp(sub ? `/api/v1/projects/${P}/${sub}` : `/api/v1/projects/${P}$`), r => r.fulfill(problem(status, status===503?"SERVICE_UNAVAILABLE":"X")));
  await go(page, path); await settle(page, 2500);
  const t = await text(page);
  console.log("=====", name, "|", JSON.stringify(t.split("\n").filter(Boolean).slice(0,30).join(" / ")).slice(0,700));
  console.log("canary", /SECRET-SERVER-DETAIL/.test(t), "reqId", /req-v1chrome-123/.test(t), "alerts", await page.locator("[role=alert]").count(), "h1", await page.locator("h1").allInnerTexts(), "focus", await fr(page), "btns", await page.locator("main button, main a").allInnerTexts().then(a=>a.map(x=>x.trim()).filter(Boolean)));
  console.log("axe", await axe(page), "card", await rect(page, "main [class*=card], main section, main div"));
  await shot(page, `state__${name}__1440`);
  await page.setViewportSize({width:640,height:360}); await settle(page,500); await shot(page, `state__${name}__zoom200`);
  await browser.close();
}
