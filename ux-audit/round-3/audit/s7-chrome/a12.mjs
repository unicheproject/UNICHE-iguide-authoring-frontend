import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2];
const { browser, page } = await open("admin", { viewport: vp });
const ae = () => page.evaluate(() => { const a = document.activeElement; return a.tagName + ":" + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 30) + (a.id ? "#" + a.id : ""); });
await go(page, `/projects/${P}/pois`); await settle(page, 1800);
const hd = await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return [b.left,b.top,b.width,b.height].map(x=>Math.round(x*10)/10); }; const hdr = document.querySelector("header"); const mb = document.querySelector("#nav-toggle"); const sw = [...hdr.querySelectorAll("button")].find(b=>/Switch project|Choose/.test(b.innerText+b.getAttribute("aria-label"))); const um = [...hdr.querySelectorAll("button")].find(b=>/account menu/.test(b.innerText)); const logo = hdr.querySelector("a"); const main = document.querySelector("main"); return { hdr: r(hdr), menu: mb && r(mb), menuVisible: mb && getComputedStyle(mb).display, logo: r(logo), sw: sw && r(sw), um: um && r(um), umText: um?.innerText.replace(/\n/g," "), nav: r(document.querySelector("nav")), navVisible: getComputedStyle(document.querySelector("nav")).display, main: r(main), docScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth, h1: r(document.querySelector("main h1")), head: document.querySelector("main h1").parentElement.parentElement.innerText.replace(/\n/g," | ").slice(0,200) }; });
console.log("HDR", vp, JSON.stringify(hd));
await shot(page, `chrome__default__${vp}`);
const mb = page.locator("#nav-toggle");
if (await mb.isVisible()) {
  const mbm = await mb.evaluate(e => ({ label: e.getAttribute("aria-label"), exp: e.getAttribute("aria-expanded"), controls: e.getAttribute("aria-controls"), size: [e.getBoundingClientRect().width, e.getBoundingClientRect().height] }));
  console.log("menu btn", JSON.stringify(mbm));
  await mb.click(); await settle(page, 600);
  const dr = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); if (!d) return null; const b = d.getBoundingClientRect(); const cs = getComputedStyle(d); return { name: d.getAttribute("aria-label") || d.getAttribute("aria-labelledby"), box: [b.left,b.top,b.width,b.height].map(Math.round), sh: cs.boxShadow.slice(-50), rad: cs.borderRadius, items: d.querySelectorAll("a").length, closeBtn: !!d.querySelector("button[aria-label*=lose]"), focus: document.activeElement.tagName + ":" + document.activeElement.textContent.trim().slice(0,25), scrim: !!document.querySelector(".bg-scrim") }; });
  console.log("DRAWER", JSON.stringify(dr)); await shot(page, `drawer__open__${vp}`);
  await page.keyboard.press("Tab"); console.log("tab1", await ae());
  await page.keyboard.press("Escape"); await settle(page, 400); console.log("esc focus", await ae());
  await mb.click(); await settle(page, 400);
  await page.getByRole("dialog").getByRole("link", { name: "Routes" }).click(); await settle(page, 1500);
  console.log("after nav click: dialogs", await page.locator("[role=dialog]").count(), "url", page.url().slice(-10), "focus", await ae());
}
// header user name truncation at this viewport
await browser.close();
