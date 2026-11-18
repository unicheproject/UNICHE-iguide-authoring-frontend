import { open, go, shot, text, settle, problem, P } from "./lib.mjs";
const fr = (page)=>page.evaluate(()=>{const e=document.activeElement;return e?e.tagName+" "+(e.getAttribute("aria-label")||e.innerText||"").trim().slice(0,40):null});
const btns = (page)=>page.evaluate(()=>[...document.querySelectorAll("main button, header button")].filter(b=>/Sav|Sign in/.test(b.innerText)).map(b=>b.innerText.trim().replace(/\s+/g," ")+"|dis="+b.disabled+"|ad="+b.getAttribute("aria-disabled")));
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await settle(page, 2500);
await page.route(/\/api\/v1\//, r => (r.request().method() !== "GET") ? r.fulfill(problem(401, "UNAUTHENTICATED")) : r.continue());
await page.locator("#f-title").click(); await page.keyboard.press("End"); await page.keyboard.type(" v1");
for (const how of ["tab-esc","stay-button","tab-esc2"]) {
  await page.keyboard.press("Control+s"); await settle(page, 3500);
  const d = page.getByRole("dialog");
  console.log(how, "dialog", await d.count(), "focus", await fr(page));
  if (how === "stay-button") await d.getByRole("button", {name:/Stay on this page/}).click(); else await page.keyboard.press("Escape");
  await settle(page, 800);
  console.log(" after dismiss: dialog", await d.count(), "focus", await fr(page), "btns", await btns(page), "status", (await text(page)).match(/(Not saved|Saving|Unsaved)[^\n]*/gi));
}
await shot(page, "session__dismissed-state__1440");
await browser.close();
