import { start, go, P, PID, seed, axe, focusInfo, API } from "./common.mjs";
const out = {}; let s = await start("1440"); let page = s.page;
const pat = new RegExp("/api/v1/projects/[^/]+/places(\\?|$)");
for (const code of [401,403,404,502,503]) {
  await page.route(pat, r => r.fulfill({status: code, contentType:"application/problem+json", body: JSON.stringify({type:"urn:x", title:"Err", status:code, detail:"Forced "+code, code:"X", requestId:"req-"+code})}));
  await go(page, `${P}/preview`); await page.waitForTimeout(2000);
  out["err"+code] = await page.evaluate(()=>document.querySelector("main")?.innerText.slice(0,260).replace(/\n/g," | ")+" || "+location.pathname.slice(-12));
  console.log(code, out["err"+code]); if ([503,404,403].includes(code)) await s.shot("preview__error-"+code);
  await page.unroute(pat);
}
// recovery via Try again
await page.route(pat, r => r.fulfill({status: 503, contentType:"application/problem+json", body: JSON.stringify({type:"urn:x", title:"U", status:503, detail:"down", code:"PLATFORM_UNAVAILABLE", requestId:"r"})}));
await go(page, `${P}/preview`); await page.waitForTimeout(1500);
await page.unroute(pat);
const tb = page.getByRole("button",{name:"Try again"}); out.tryAgain = await tb.count();
if (out.tryAgain) { await tb.click(); await page.waitForTimeout(2000); out.recovered = await page.getByRole("button",{name:"Kiosk",exact:true}).count(); }
// slow load
await page.route(pat, async r => { await new Promise(x=>setTimeout(x,5000)); r.continue(); });
page.goto(`http://localhost:5173${P}/preview`).catch(()=>{}); await page.waitForTimeout(2500); await s.shot("preview__loading");
out.loading = await page.evaluate(()=>[...document.querySelectorAll("[aria-busy]")].map(e=>e.tagName+":"+e.getAttribute("aria-label")+"/"+e.getAttribute("role")));
await page.unroute(pat);
// offline while on page then fire
await go(page, `${P}/preview`); await page.waitForTimeout(1500);
// stale note tests
const sel = page.getByLabel("Fire trigger");
await sel.selectOption({label:(await sel.locator("option").allTextContents()).find(t=>/frieze-101/.test(t))});
await page.waitForTimeout(400);
await page.getByRole("button",{name:"Mobile",exact:true}).click(); await page.waitForTimeout(400);
out.noteAfterSurface = (await page.locator("[data-preview-frame]").innerText()).includes("Opened by QR code");
await page.getByRole("button",{name:"Live content"}).click(); await page.waitForTimeout(400);
out.afterLive = (await page.locator("[data-preview-frame]").innerText()).slice(0,120).replace(/\n/g," | ");
await s.shot("preview__after-live-mobile");
// Working copy vs frieze
await page.getByRole("button",{name:"Working content"}).click(); await page.waitForTimeout(300);
out.workingTitle = (await page.locator("[data-preview-frame] h1").allTextContents());
// keyboard: select focus ring, Esc, focus in frame then chrome op
await page.getByLabel("Fire trigger").focus(); await s.shot("preview__select-focus");
out.selectFocus = await page.evaluate(()=>{const e=document.activeElement;const c=getComputedStyle(e);return {outline:c.outlineStyle+" "+c.outlineWidth, shadow:c.boxShadow.slice(0,40), border:c.borderColor}});
// beacon on WEB
await page.getByRole("button",{name:"Web",exact:true}).click();
const opt = (await sel.locator("option").allTextContents()).find(t=>/beacon/i.test(t)); await sel.selectOption({label:opt}); await page.waitForTimeout(400);
out.beaconWeb = (await page.locator("[data-preview-frame]").innerText()).includes("Nearby");
// trigger of DRAFT target in live mode
await page.getByRole("button",{name:"Live content"}).click(); await page.waitForTimeout(300);
out.liveOptsCount = await sel.locator("option").count();
await s.browser.close();
// zoom200
s = await start("zoom200"); page = s.page;
await go(page, `${P}/preview`); await page.waitForTimeout(2000); await s.shot("preview__zoom200");
out.zoomScrollW = await page.evaluate(()=>document.documentElement.scrollWidth);
await go(page, `${P}/pois/${seed.pois[0].id}`); await page.waitForTimeout(2500);
await page.getByRole("button",{name:"Preview in app"}).click(); await page.waitForTimeout(600); await s.shot("editor__preview-open__zoom200");
out.zoomDlg = await page.getByRole("dialog").boundingBox();
await s.browser.close();
s.save? 0:0;
import("node:fs").then(f=>f.writeFileSync("ux-audit/round-1/audit/s14-preview/out/e1.json",JSON.stringify(out,null,1)));
console.log(JSON.stringify(out,null,1));
