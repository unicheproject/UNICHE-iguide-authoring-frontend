import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
const urls = new Set(); page.on("request", r => { if (r.url().includes("/assets")) urls.add(r.method() + " " + r.url().replace(/^.*\/api\/v1/, "").slice(0, 140)); });
await go(page, `/projects/${P}/media`); await settle(page);
console.log([...urls].slice(0, 8));
const body = await page.evaluate(() => 0);
// empty
await page.route(/\/assets(\?|$)/, (route) => route.request().method() === "GET" ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [], page: 0, size: 48, totalElements: 0, totalPages: 0 }) }) : route.fallback());
await page.reload(); await page.waitForTimeout(2500);
console.log("EMPTY", await page.evaluate(() => document.querySelector("main")?.innerText.replace(/\n+/g, " | ")));
await shot(page, `lib__empty__${vp}`);
await page.unroute(/\/assets(\?|$)/);
// 503
await page.route(/\/assets(\?|$)/, (route) => route.request().method() === "GET" ? route.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title: "SECRET title", status: 503, detail: "NullPointerException at X", code: "UNAVAILABLE", requestId: "req-r3-s13-503" }) }) : route.fallback());
await page.reload(); await page.waitForTimeout(3000);
console.log("503", await page.evaluate(() => document.querySelector("main")?.innerText.replace(/\n+/g, " | ")));
await shot(page, `lib__503__${vp}`);
await page.getByRole("button", { name: "Try again" }).focus().catch(()=>{});
console.log("tryagain focus ok", await page.evaluate(()=>document.activeElement.textContent.trim()));
await page.unroute(/\/assets(\?|$)/);
// loading skeleton
await page.route(/\/assets(\?|$)/, async (route) => { await new Promise(r => setTimeout(r, 6000)); route.fallback(); });
await page.goto(`http://localhost:5173/projects/${P}/media?view=list`); await page.waitForTimeout(2500);
console.log("LOADING", await page.evaluate(() => ({ thead: !!document.querySelector("thead"), status: [...document.querySelectorAll("[role=status],[aria-busy=true]")].map(e=>e.textContent.trim().slice(0,40)), anims: document.getAnimations().length, tb: document.querySelector("main")?.innerText.slice(0,200).replace(/\n+/g," | ") })));
await shot(page, `lib__loading-list__${vp}`);
await page.unroute(/\/assets(\?|$)/);
await page.route(/\/assets(\?|$)/, async (route) => { await new Promise(r => setTimeout(r, 6000)); route.fallback(); });
await page.goto(`http://localhost:5173/projects/${P}/media`); await page.waitForTimeout(2500);
await shot(page, `lib__loading-grid__${vp}`);
console.log("GRID LOADING", await page.evaluate(() => document.querySelector("main")?.innerText.slice(0,200).replace(/\n+/g," | ")));
await browser.close();
