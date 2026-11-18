import { open, go, P, shot, settle } from "./h.mjs";
const lum = c => { const [r,g,b] = c.match(/[\d.]+/g).slice(0,3).map(Number).map(v => { v/=255; return v<=0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; }); return 0.2126*r+0.7152*g+0.0722*b; };
const cr = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return +((x+0.05)/(y+0.05)).toFixed(2); };
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await page.route("**/iguide/api/v1/**", r => { const q = r.request(); if (q.resourceType()==="document" || !/\/pois(\?|$)/.test(q.url())) return r.continue(); r.fulfill({ status: 503, contentType: "application/problem+json", body: JSON.stringify({status:503,code:"SERVICE_UNAVAILABLE",requestId:"req-x"}) }); });
  await go(page, `/projects/${P}/pois`); await settle(page, 2500);
  const c = await page.evaluate(() => { const a = document.querySelector("main [role=alert]"); const t = a.querySelector("strong,h2,h3,p"); const cs = getComputedStyle(a), ts = getComputedStyle(t); const mono = [...a.querySelectorAll("*")].filter(e => getComputedStyle(e).fontFamily.includes("mono")).map(e => e.tagName+":"+e.textContent.trim().slice(0,22)); const btn = a.querySelector("button"); const bs = btn && getComputedStyle(btn); const rid = [...a.querySelectorAll("*")].find(e => /Request id/.test(e.textContent) && e.children.length<3); const rs = rid && getComputedStyle(rid); return { bg: cs.backgroundColor, titleColor: ts.color, titleTag: t.tagName, titleFs: ts.fontSize, pad: cs.padding, rad: cs.borderRadius, mono, rid: rs && [rs.fontSize, rs.color, rs.fontFamily.slice(0,20)], btnFont: bs && bs.fontFamily.slice(0,20) }; });
  console.log("ALERT", JSON.stringify(c), "contrast title/bg", cr(c.titleColor, c.bg), "rid/bg", c.rid && cr(c.rid[1], c.bg));
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440", forcedColors: "active" });
  await go(page, `/projects/${P}/pois`); await settle(page, 2000); await shot(page, "chrome__forced__1440");
  const nav = await page.evaluate(() => { const a = document.querySelector("nav a[aria-current=page]"); const o = [...document.querySelectorAll("nav a")].find(x=>!x.getAttribute("aria-current")); const f = x => { const cs = getComputedStyle(x); return { bg: cs.backgroundColor, color: cs.color, border: cs.borderLeft, bs: cs.boxShadow.slice(0,50), fw: cs.fontWeight }; }; return { active: f(a), other: f(o) }; });
  console.log("FORCED nav", JSON.stringify(nav));
  await page.getByRole("button", { name: /UX Audit – Populated/ }).first().click(); await settle(page, 500); await shot(page, "switcher__forced__1440");
  await page.keyboard.press("Escape");
  await page.goto(`http://localhost:5173/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await settle(page, 3000);
  const b = page.getByRole("button", { name: "Copy link" }).first(); await b.scrollIntoViewIfNeeded();
  await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("no")) }, configurable: true }); });
  await b.click(); await settle(page, 500); await shot(page, "toast__warning-forced__1440");
  const t = await page.evaluate(() => { const x = document.querySelector(".z-toast > div"); const cs = getComputedStyle(x); return { border: cs.border, bg: cs.backgroundColor }; }); console.log("FORCED toast", JSON.stringify(t));
  await browser.close();
}
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, `/projects/${P}/pois`); await settle(page, 1800);
  const link = page.locator("nav a", { hasText: "Routes" });
  const base = await link.evaluate(e => getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).color);
  await link.hover(); await settle(page, 300);
  const hov = await link.evaluate(e => getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).color + "|" + getComputedStyle(e).cursor);
  await page.mouse.down(); const act = await link.evaluate(e => getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).color); await page.mouse.up();
  console.log("NAV states base/hover/active", base, hov, act);
  const sw = page.getByRole("button", { name: /UX Audit – Populated/ }).first();
  const s0 = await sw.evaluate(e => getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).borderColor); await sw.hover(); await settle(page, 300);
  const s1 = await sw.evaluate(e => getComputedStyle(e).backgroundColor + "|" + getComputedStyle(e).borderColor); console.log("SWITCHER base/hover", s0, s1);
  const um = page.getByRole("button", { name: /account menu/ }); const u0 = await um.evaluate(e => getComputedStyle(e).backgroundColor); await um.hover(); await settle(page,300); const u1 = await um.evaluate(e => getComputedStyle(e).backgroundColor); console.log("USERMENU base/hover", u0, u1);
  const lg = page.locator("header a").first(); await lg.hover(); console.log("logo hover cursor", await lg.evaluate(e=>getComputedStyle(e).cursor+"|"+e.getAttribute("href")));
  // contrast of nav text, group label, muted subtitle
  const cs = await page.evaluate(() => { const g = (sel) => { const e = document.querySelector(sel); const cs = getComputedStyle(e); let bg = cs.backgroundColor, p = e; while (bg === "rgba(0, 0, 0, 0)" && p.parentElement) { p = p.parentElement; bg = getComputedStyle(p).backgroundColor; } return [cs.color, bg, cs.fontSize]; }; return { navLabel: g("nav a"), group: g("nav p, nav h2, nav div[class*=uppercase], nav span"), sub: g("main p") }; });
  console.log("CONTRAST", JSON.stringify(cs), "nav", cr(cs.navLabel[0], cs.navLabel[1]), "sub", cr(cs.sub[0], cs.sub[1]), "group", cr(cs.group[0], cs.group[1]));
  await browser.close();
}
