import { open, go, P, shot, settle } from "./h.mjs";
import { createRequire } from "node:module";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { chromium } = require("@playwright/test");
const card = p => p.evaluate(() => { const h = document.querySelector("h1"); const c = h?.closest("[class*=rounded]"); const b = c?.getBoundingClientRect(); return { h1: h?.textContent, fs: h && getComputedStyle(h).fontSize, cardTop: b && Math.round(b.top), cardW: b && Math.round(b.width), text: document.querySelector("main")?.innerText.replace(/\n+/g, " | ").slice(0, 600), title: document.title, focus: document.activeElement.tagName + ":" + document.activeElement.textContent.trim().slice(0, 30), details: !!document.querySelector("details"), live: [...document.querySelectorAll("[role=status],[role=alert]")].map(e=>e.textContent.trim().slice(0,60)).filter(Boolean) }; });
// A: session loop
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/pois`); await settle(page, 1500);
  await page.evaluate(() => sessionStorage.setItem("iguide.signInRedirectAt", String(Date.now())));
  await page.route("**/iguide/api/v1/**", r => r.request().resourceType()==="document" ? r.continue() : r.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({status:401,code:"UNAUTHENTICATED",requestId:"r401"}) }));
  await page.getByRole("link", { name: "Places", exact: true }).first().click(); await settle(page, 2500);
  console.log("LOOP", JSON.stringify(await card(page))); await shot(page, "session-loop__card__1440");
  await browser.close();
}
// B: IdP unreachable (fresh ctx)
{
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  await p.route(/\/realms\//, r => r.abort());
  const t0 = Date.now();
  await p.goto("http://localhost:5173/"); 
  for (const ms of [500, 2000, 5000, 9000, 14000]) { await p.waitForTimeout(ms - (Date.now() - t0) > 0 ? ms - (Date.now() - t0) : 0); console.log("IDP-down t", ms, JSON.stringify((await p.evaluate(() => document.body.innerText.slice(0, 120).replace(/\n/g, " | "))))); }
  console.log("UNREACHABLE", JSON.stringify(await card(p))); await shot(p, "session-unreachable__card__1440");
  await b.close();
}
// C: offline create dialog
{
  const { browser, context, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/pois`); await settle(page, 1800);
  await context.setOffline(true); await page.evaluate(() => window.dispatchEvent(new Event("offline"))); await settle(page, 600);
  await page.keyboard.press("Tab");
  const btn = page.getByRole("button", { name: "New point of interest" });
  const r = await btn.evaluate(e => { const b = e.getBoundingClientRect(); const top = document.elementFromPoint(b.left + b.width/2, b.top + b.height/2); return { covered: top !== e && !e.contains(top), topEl: top.tagName + ":" + top.textContent.trim().slice(0, 30), ad: e.getAttribute("aria-disabled"), title: e.getAttribute("title") }; });
  console.log("OFFLINE new btn", JSON.stringify(r));
  await btn.focus(); await page.keyboard.press("Enter"); await settle(page, 800);
  console.log("offline dialog opened:", await page.locator("[role=dialog]").count());
  if (await page.locator("[role=dialog]").count()) {
    await page.locator("[role=dialog] input").first().fill("UX-R3-s7-chrome offline probe");
    await page.getByRole("button", { name: /create and open/i }).click(); await settle(page, 1500);
    console.log("offline submit ->", JSON.stringify(await page.evaluate(() => ({ dlg: document.querySelector("[role=dialog]")?.innerText.replace(/\n+/g, " | ").slice(0, 400), url: location.pathname.slice(-20), toasts: [...document.querySelectorAll(".z-toast > div")].map(x => x.innerText.replace(/\n+/g," | ")) })))); await shot(page, "offline__create-submit__1440");
  }
  await context.setOffline(false); await browser.close();
}
