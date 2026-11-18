import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const foc = () => page.evaluate(() => { const a=document.activeElement; return a.tagName + ":" + (a.getAttribute("aria-label")||a.innerText||a.placeholder||"").slice(0,40).replace(/\n/g," "); });
// (b) tree collapse in Places
await go(page, `/projects/${P}/places`); await settle(page, 2000);
const n0 = await page.locator("main table tbody tr").count();
const chev = page.locator("main table tbody tr").first().locator("button[aria-label^='Sub-items']");
console.log("chevron label:", await chev.getAttribute("aria-label"), "exp", await chev.getAttribute("aria-expanded"), "box", JSON.stringify(await chev.boundingBox()));
await chev.focus(); await page.keyboard.press("Enter"); await settle(page, 500);
console.log("collapsed: rows", n0, "->", await page.locator("main table tbody tr").count(), "focus", await foc(), "exp", await chev.getAttribute("aria-expanded"), "live", await page.evaluate(() => [...document.querySelectorAll("[role=status]")].map(e=>e.textContent.trim()).filter(Boolean)));
await shot(page, "places__collapsed__1440");
await page.keyboard.press("Enter"); await settle(page, 400);
// tree indent measure
const ind = await page.evaluate(() => [...document.querySelectorAll("main table tbody tr")].slice(0, 14).map(tr => { const c = tr.querySelector("td:nth-child(2) > div"); const chev = tr.querySelector("button[aria-label^='Sub-items']"); const a = tr.querySelector("td:nth-child(2) a"); const g = tr.querySelectorAll(".list-guide").length; return `${(c.style.paddingInlineStart||"0")} chev=${chev?Math.round(chev.getBoundingClientRect().x):"-"} title=${Math.round(a.getBoundingClientRect().x)} guides=${g}`; }));
console.log(ind.join("\n"));
// (c) keyboard: Tabs from h1 to first row link
await go(page, `/projects/${P}/pois`); await settle(page, 2000);
await page.evaluate(() => { const h = document.querySelector("main h1"); h.setAttribute("tabindex","-1"); h.focus(); });
const trail = [];
for (let i = 0; i < 16; i++) { await page.keyboard.press("Tab"); trail.push(await foc()); if (/Parthenon Frieze/.test(trail[trail.length-1])) break; }
console.log("tab trail:", trail.length, trail.join(" > "));
// '/' shortcut + search announcement
await page.keyboard.press("Escape"); await page.evaluate(() => document.querySelector("main h1").focus());
await page.keyboard.press("/"); console.log("after '/':", await foc());
await page.keyboard.type("frieze", { delay: 60 }); await settle(page, 1200);
console.log("live after search:", await page.evaluate(() => [...document.querySelectorAll("[role=status],[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean)), "url", await page.evaluate(()=>location.search));
console.log("match hints:", await page.evaluate(() => [...document.querySelectorAll("main table tbody tr")].slice(0,5).map(t=>t.innerText.replace(/\n+/g," | ").slice(0,160))));
await shot(page, "pois__search-frieze__1440");
// (e) row click
await page.locator("main table tbody tr").first().locator("td").nth(3).click({ position: { x: 5, y: 5 } }); await settle(page, 1200);
console.log("row click ->", await page.evaluate(() => location.pathname.split("/").slice(-2).join("/")));
await browser.close();
