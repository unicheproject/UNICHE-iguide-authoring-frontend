import { open, CMS, P, settle, attach, rec, tryDo, here } from "./lib.mjs";
import { createRequire } from "node:module"; import { join } from "node:path";
const require = createRequire(join(here, "..","..","..","..","package.json")); const { chromium } = require("@playwright/test");
const log = console.log;
// --- sign-in fresh
{
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); const e = attach(page, "signin");
  await page.goto(CMS + "/"); await settle(page, 2500);
  const r = await rec(page, "sign-in", {}); log("sign-in", r.url, r.h1, r.violations.map(v=>v.id+":"+v.impact).join(","), e.pageerror.length, e.console.length, e.console.slice(0,2));
  await ctx.setViewportSize?.({ width: 768, height: 1024 }); await page.setViewportSize({ width: 768, height: 1024 }); await rec(page, "sign-in", { vp: "768" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await ctx.setOffline(true); await page.waitForTimeout(1500); await rec(page, "sign-in-offline", {}); await ctx.setOffline(false);
  await browser.close();
}
// --- admin: create project steps
{
  const { browser, page } = await open("admin", { viewport: "1440" }); const e = attach(page, "create");
  await page.goto(CMS + "/projects/new"); await settle(page);
  const rr = async (n) => { const r = await rec(page, n, {}); log(n, r.h1, r.violations.map(v=>v.id+":"+v.impact).join(","), e.pageerror.length, e.console.length); };
  await rr("create-step1");
  await tryDo("c-step1-empty", async () => { await page.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(700); }); await rr("create-step1-errors");
  await tryDo("c-fill", async () => { await page.getByLabel(/Project name/i).fill("UX-verify do not submit"); await page.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(1500); }); await rr("create-step2");
  await tryDo("c-s2", async () => { await page.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(1000); }); await rr("create-step3");
  await tryDo("c-s3", async () => { await page.getByRole("button", { name: /Continue to review/ }).click(); await page.waitForTimeout(1000); }); await rr("create-step4");
  await page.setViewportSize({ width: 768, height: 1024 }); await rr("create-step4-768");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(CMS + "/"); await settle(page); await rr("home-admin");
  await browser.close();
}
// --- forced errors
{
  const { browser, page, context } = await open("curator", { viewport: "1440" }); const e = attach(page, "forced");
  for (const code of [403, 404, 503]) {
    await page.route(new RegExp(`/projects/${P}$`), (route) => route.fulfill({ status: code, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "x", status: code, code: code === 403 ? "FORBIDDEN" : code === 404 ? "NOT_FOUND" : "SERVICE_UNAVAILABLE", requestId: "verify-req-" + code }) }));
    await page.goto(`${CMS}/projects/${P}/pois`); await settle(page, 2500);
    const r = await rec(page, `forced-${code}`, {}); log("forced", code, r.h1, r.title, r.violations.map(v=>v.id+":"+v.impact).join(","), (await page.locator("main").innerText().catch(()=>"")).slice(0,200).replace(/\n/g," | "));
    await page.unroute(new RegExp(`/projects/${P}$`));
  }
  // list load failure 503
  await page.route(/\/projects\/[^/]+\/pois(\?.*)?$/, (route) => route.request().method()==="GET" ? route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ title: "x", status: 503, code: "SERVICE_UNAVAILABLE", requestId: "verify-req-list" }) }) : route.continue());
  await page.goto(`${CMS}/projects/${P}/pois`); await settle(page, 2000); const r = await rec(page, "forced-list-503", {}); log("list503", r.h1, r.violations.map(v=>v.id+":"+v.impact).join(","), (await page.locator("main").innerText().catch(()=>"")).slice(0,200).replace(/\n/g," | "));
  await page.unroute(/\/projects\/[^/]+\/pois(\?.*)?$/);
  // offline banner
  await page.goto(`${CMS}/projects/${P}`); await settle(page); await context.setOffline(true);
  await page.getByRole("link", { name: /Points of Interest/ }).first().click().catch(()=>{}); await page.waitForTimeout(3000); await rec(page, "offline-banner", {}); await context.setOffline(false);
  log("errs", JSON.stringify(e).slice(0,600));
  await browser.close();
}
