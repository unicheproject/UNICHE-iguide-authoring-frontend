import { start, go, P, seed, axe, focusInfo, PID } from "./common.mjs";
const out = {}; const s = await start("1440"); const page = s.page;
const q = async (qs, name) => { await go(page, `${P}/app-preview${qs}`); await page.waitForTimeout(1800);
  const r = await page.evaluate(() => { const w = document.querySelector("main > div"); const rr = w?.getBoundingClientRect(); return { url: location.search, title: document.title, wrapW: rr&&Math.round(rr.width), wrapH: rr&&Math.round(rr.height), font: w&&getComputedStyle(w).fontSize, lang: w?.getAttribute("lang"), h1s:[...document.querySelectorAll("h1")].map(h=>h.textContent.trim().slice(0,30)), tabbables: document.querySelectorAll("a,button,input,select,[tabindex]").length, controls: [...document.querySelectorAll("select,input")].length, docScrollH: document.documentElement.scrollHeight, landmarks: [...document.querySelectorAll("main,header,nav,footer")].map(e=>e.tagName).join(","), bodyText: document.body.innerText.slice(0,100).replace(/\n/g," | ") } });
  out[name]=r; if (name) await s.shot("newtab__"+name); console.log(name, JSON.stringify(r)); };
await q("?surface=WEB","web");
await q("?surface=KIOSK&lang=el","kiosk-el");
await q("?surface=MOBILE&mode=LIVE","mobile-live");
await q("?surface=kiosk","lowercase-kiosk");
await q("?surface=KIOSK&lang=zz&mode=bogus","bad-params");
await q("?t=frieze-101&surface=MOBILE","qr-mobile");
await q("?t=nonexistent","qr-unknown");
await q("?t=frieze-101","qr-web-axe"); out.axe = await axe(page,"newtab");
// invalid project
await go(page, `/projects/00000000-0000-0000-0000-000000000000/app-preview`); await page.waitForTimeout(2000); await s.shot("newtab__404-project"); out.badProject = await page.evaluate(()=>document.body.innerText.slice(0,200));
// forced error states on Preview page
for (const code of [401,403,404,502,503,504]) {
  await page.route("**/places**", r => r.fulfill({status: code, contentType:"application/problem+json", body: JSON.stringify({type:"urn:x", title:"Err", status:code, detail:"Forced "+code, code:"X", requestId:"req-"+code})}));
  await go(page, `${P}/preview`); await page.waitForTimeout(1800);
  out["err"+code] = await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,250).replace(/\n/g," | ")+" || url="+location.pathname.slice(-30));
  console.log(code, out["err"+code]); if ([503,404].includes(code)) await s.shot("preview__error-"+code);
  await page.unroute("**/places**");
}
// new tab with forced error
await page.route("**/places**", r => r.fulfill({status: 503, contentType:"application/problem+json", body: JSON.stringify({type:"urn:x", title:"Unavailable", status:503, detail:"down", code:"X"})}));
await go(page, `${P}/app-preview`); await page.waitForTimeout(1800); await s.shot("newtab__error-503"); out.newtab503 = await page.evaluate(()=>document.body.innerText.slice(0,200)); await page.unroute("**/places**");
// slow load
await page.route("**/places**", async r => { await new Promise(x=>setTimeout(x,4000)); r.continue(); });
await go(page, `${P}/preview`).catch(()=>{}); await page.waitForTimeout(700); await s.shot("preview__loading"); out.loadingA11y = await page.evaluate(()=>[...document.querySelectorAll("[aria-busy]")].map(e=>e.getAttribute("aria-label")+"/"+e.getAttribute("role")));
await page.unroute("**/places**");
s.save("d1.json", out); await s.browser.close();
