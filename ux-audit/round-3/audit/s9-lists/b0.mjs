import { open, go, P, shot, settle, KINDS } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/routes`); await settle(page, 2000);
console.log(await page.evaluate(() => {
  const out = [];
  const t = document.querySelector("table"); out.push("table:" + (t && t.outerHTML.slice(0, 1800)));
  const m = document.querySelector("main"); out.push([...m.querySelectorAll("h1,[role=tablist],[role=toolbar],button")].slice(0,25).map(e => e.tagName + "|" + (e.getAttribute("aria-label")||"") + "|" + e.textContent.trim().slice(0,40)).join("\n"));
  return out.join("\n\n");
}));
await shot(page, "routes__default__1440");
await browser.close();
