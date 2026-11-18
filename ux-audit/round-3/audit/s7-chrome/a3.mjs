import { open, go, P, shot, settle } from "./h.mjs";
import { createRequire } from "node:module";
import { join } from "node:path";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const { chromium } = require("@playwright/test");
// 1 sign-in fresh
{
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  await p.goto("http://localhost:5173/"); 
  const t0 = Date.now();
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(250); console.log("signin t", Date.now()-t0, p.url().slice(0,60), await p.evaluate(()=>document.body.innerText.slice(0,80).replace(/\n/g," | "))); }
  await p.waitForTimeout(3000);
  console.log("url", p.url().slice(0, 80));
  const m = await p.evaluate(() => { const h=document.querySelector("h1"); const card=h?.closest("section"); const cb=card?.getBoundingClientRect(); return { h1:h?.textContent, fs:h&&getComputedStyle(h).fontSize, cardTop:cb?.top, cardW:cb?.width, title:document.title, text:document.body.innerText.replace(/\n+/g," | "), focus:document.activeElement?.tagName, hdr:[...document.querySelectorAll("header img, header svg")].length, logos:[...document.querySelectorAll("img,svg")].length}; });
  console.log("SIGNIN", JSON.stringify(m));
  await shot(p, "signin__default__1440");
  await p.keyboard.press("Tab"); const f1 = await p.evaluate(()=>document.activeElement.textContent.trim()); await p.keyboard.press("Tab"); const f2 = await p.evaluate(()=>document.activeElement.textContent.trim().slice(0,40));
  console.log("tab order", f1, "|", f2); await shot(p, "signin__focus-button__1440");
  const btn = p.getByRole("button", { name: /sign in with uniche/i });
  await btn.hover(); await shot(p, "signin__hover__1440");
  await b.close();
}
// 2 offline + session
const { browser, context, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/pois`); await settle(page, 2000);
const before = await page.evaluate(() => ({ h1: document.querySelector("h1").getBoundingClientRect().top, tb: document.querySelector("main").scrollHeight }));
await context.setOffline(true);
await page.evaluate(() => window.dispatchEvent(new Event("offline")));
await settle(page, 800);
const off = await page.evaluate(() => { const a = document.querySelector('[role=alert]'); const b = a?.getBoundingClientRect(); return { h1: document.querySelector("h1").getBoundingClientRect().top, alert: a?.innerText, box: b && [b.left,b.top,b.width,b.height].map(Math.round), disabledControls: [...document.querySelectorAll("button,a")].filter(x => x.getAttribute("aria-disabled")==="true" || x.disabled).map(x => (x.textContent||x.getAttribute("aria-label")).trim().slice(0,30)) , newBtn: (()=>{const x=[...document.querySelectorAll("button,a")].find(x=>/new point of interest/i.test(x.textContent)); return x && {ad:x.getAttribute("aria-disabled"), title:x.title, dis:x.disabled}})() }; });
console.log("OFFLINE", before, JSON.stringify(off));
await shot(page, "offline__poilist__1440");
await page.getByRole("button", { name: "New point of interest" }).click().catch(()=>{}); await settle(page, 500);
await shot(page, "offline__click-new__1440");
console.log("after click new: dialogs", await page.locator("[role=dialog]").count(), "toasts", await page.locator("[role=status],[role=alert]").allInnerTexts());
await page.keyboard.press("Tab"); 
await context.setOffline(false);
await page.getByRole("button", { name: /check again/i }).click().catch(()=>{}); await settle(page, 1500);
console.log("after back online alert:", await page.locator("[role=alert]").allInnerTexts());
await shot(page, "offline__back-online__1440");
// session ended
await page.route("**/iguide/api/v1/**", r => r.request().resourceType()==="document" ? r.continue() : r.fulfill({ status: 401, contentType: "application/problem+json", body: JSON.stringify({status:401,code:"UNAUTHENTICATED",title:"x",requestId:"r401"}) }));
await page.getByRole("link", { name: "Places", exact: true }).first().click(); await settle(page, 2500);
console.log("SESSION url", page.url().slice(0,70), "dialogs", await page.locator("[role=dialog]").allInnerTexts());
await shot(page, "session-ended__dialog__1440");
const dm = await page.evaluate(() => { const d=document.querySelector("[role=dialog]"); if(!d) return null; const b=d.getBoundingClientRect(); const cs=getComputedStyle(d); return {w:b.width,h:b.height,radius:cs.borderRadius,shadow:cs.boxShadow,pad:cs.padding,focus:document.activeElement.tagName+":"+document.activeElement.textContent.trim().slice(0,30), hasH2:!!d.querySelector("h2")}; });
console.log("session dialog", JSON.stringify(dm));
await page.keyboard.press("Escape"); await settle(page, 400);
console.log("after esc dialogs", await page.locator("[role=dialog]").count(), "focus", await page.evaluate(()=>document.activeElement.tagName+":"+document.activeElement.textContent.trim().slice(0,30)));
await browser.close();
