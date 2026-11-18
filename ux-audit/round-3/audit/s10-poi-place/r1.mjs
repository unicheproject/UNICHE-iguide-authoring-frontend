import { open, go, shot, settle, P } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await go(page, `/projects/${P}/places`); await settle(page,1500);
  await page.getByRole("link",{name:/^Acropolis Museum$/}).first().click(); await page.waitForURL(/places\/[0-9a-f-]{36}/); await settle(page,2500);
  await shot(page,"place-indoor__top__1440");
  const side = page.locator(".side-more");
  console.log("side client/scroll:", await side.evaluate(e=>`${e.clientHeight}/${e.scrollHeight} overflowY ${getComputedStyle(e).overflowY} mask ${getComputedStyle(e).maskImage.slice(0,60)} after ${getComputedStyle(e,"::after").content}`));
  console.log("Show all:", await page.getByRole("button",{name:/Show all/}).count(), await page.getByRole("button",{name:/Show all/}).allInnerTexts());
  await side.evaluate(e=>e.scrollTo(0,e.scrollHeight)); await settle(page,400);
  await shot(page,"place-indoor__side-scrolled__1440");
  console.log("setup:", (await page.locator("#setup").innerText()).split("\n").filter(l=>!/^\s{2}/.test(l)).slice(0,14).join(" / "));
  const sa = page.getByRole("button",{name:/Show all/}).first(); if (await sa.count()) { await sa.click(); await settle(page,500); await shot(page,"place-indoor__used-in-expanded__1440"); console.log("after show all:", await page.evaluate(()=>document.activeElement.textContent.trim().slice(0,30))); }
} finally { await browser.close(); }
