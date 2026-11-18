import { open, go, P, shot, small } from "./lib.mjs";
const log = (...a) => console.log(...a);
const { browser, context, page } = await open("curator", { viewport: "768", touch: true });
await page.setViewportSize({ width: 768, height: 600 });
await go(page, `/projects/${P}/preview`); await page.waitForTimeout(2500);
await shot(page, "preview__kbd-height__768x600");
await page.getByRole("button", { name: /^kiosk$/i }).tap(); await page.waitForTimeout(500);
await page.evaluate(()=>document.querySelector("main").scrollTo(0,420)); await page.waitForTimeout(300);
await shot(page, "preview__kbd-height-scrolled__768x600");
// frame tap: open kiosk tile
await page.getByRole("button", { name: /Points of interest/i }).first().tap().catch(e=>log("tap err")); await page.waitForTimeout(500);
await shot(page, "preview__kiosk-after-tile__768x600");
// POI editor in-editor preview, Esc
await go(page, `/projects/${P}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await page.waitForTimeout(2000);
await page.getByRole("button",{name:/Preview in app/}).tap(); await page.waitForTimeout(800);
await shot(page, "poi-editor__preview-open__768x600");
log("dialog role", await page.locator("[role=dialog]").count(), "focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,100)));
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
log("after esc, popover visible:", await page.getByText("In the app").isVisible().catch(()=>false));
// keyboard: tab through preview page
await go(page, `/projects/${P}/preview`); await page.waitForTimeout(1500);
const seq=[]; for (let i=0;i<22;i++){ await page.keyboard.press("Tab"); seq.push(await page.evaluate(()=>{const e=document.activeElement;return (e.getAttribute("aria-label")||e.textContent||e.tagName).trim().slice(0,22)})); }
log("tab order", seq.join(" > "));
// forced 503
await page.route("**/api/v1/**/pois*", r=>r.fulfill({status:503, contentType:"application/problem+json", body: JSON.stringify({type:"about:blank",title:"x",status:503,code:"PLATFORM_UNAVAILABLE",requestId:"r-1"})}));
await go(page, `/projects/${P}/preview`); await page.waitForTimeout(2500);
await shot(page, "preview__error-503__768x600");
await browser.close();
