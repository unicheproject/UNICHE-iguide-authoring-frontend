import * as H from "./h.mjs";
const log = H.LOG("e4");
for (const vp of ["1440","1024","768"]) {
const { browser, context, page } = await H.session({ viewport: vp });
await H.go(page, H.P("/pois")); await H.sleep(1500);
await context.setOffline(true); await H.sleep(900);
const m = await page.evaluate(() => { const b = [...document.querySelectorAll("[role=alert],[role=status]")].find(e => /offline/i.test(e.textContent)); if (!b) return null; const r = b.getBoundingClientRect(); const btn = b.querySelector("button")?.getBoundingClientRect(); const h = document.querySelector("header")?.getBoundingClientRect(); const ph = document.querySelector("h1")?.getBoundingClientRect(); return { banner: [r.x,r.y,r.width,r.height].map(Math.round), scrollH: b.scrollHeight, clientH: b.clientHeight, btn: btn && [btn.x,btn.y,btn.width,btn.height].map(Math.round), h1: ph && [ph.x,ph.y].map(Math.round), cls: b.className.slice(0,120) }; });
log(vp, "list offline", m);
await H.shot(page, `poi-list__offline__${vp}`);
await context.setOffline(false); await browser.close();
}
