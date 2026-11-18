import { open, go, P, POI, seed, shot, settle } from "./lib.mjs";
let { browser, page } = await open("curator", { viewport: "768", touch: true });
await go(page, `/projects/${P}/preview`); await settle(page, 3000);
await page.getByRole("tab", { name: "Kiosk", exact: true }).tap();
const info = () => page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); const r=f.getBoundingClientRect(); const sc=[f,...f.querySelectorAll("*"),f.parentElement,f.parentElement.parentElement].find(x=>x.scrollWidth>x.clientWidth+2&&["auto","scroll"].includes(getComputedStyle(x).overflowX)); return { scale:f.getAttribute("data-scale"), w:Math.round(r.width), h:Math.round(r.height), hscroller: sc?`${sc.scrollWidth}/${sc.clientWidth}`:"none", pageSW: document.documentElement.scrollWidth }; });
for (const [o,z] of [["Portrait","Fit"],["Portrait","100 %"],["Landscape","Fit"],["Landscape","100 %"]]) { await page.getByRole("tab", { name: o }).tap(); await page.getByRole("tab", { name: z, exact: true }).tap(); await page.waitForTimeout(700); console.log("768 kiosk", o, z, JSON.stringify(await info())); await shot(page, `preview__kiosk-${o.toLowerCase()}-${z.replace(/\W/g,"")}__768`, false); }
// keyboard run
await page.setViewportSize({ width: 1280, height: 720 }); await go(page, `/projects/${P}/preview`); await settle(page, 3000);
await page.keyboard.press("Tab"); const seq=[]; for (let i=0;i<30;i++){ seq.push(await page.evaluate(()=>{const e=document.activeElement; return (e.getAttribute("aria-label")||e.textContent||e.tagName).trim().replace(/\s+/g," ").slice(0,28)+"|"+(e.getAttribute("role")||e.tagName.toLowerCase())})); await page.keyboard.press("Tab"); }
console.log("tab order:", seq.join(" > "));
// arrow keys in tablist
await page.getByRole("tab", { name: "Web", exact: true }).focus(); await page.keyboard.press("ArrowRight"); await page.waitForTimeout(300);
console.log("after ArrowRight on Surface:", await page.evaluate(()=>document.activeElement.textContent.trim()), "selected:", await page.evaluate(()=>[...document.querySelectorAll('[role=tab][aria-selected=true]')].map(t=>t.textContent.trim()).join(",")));
await page.keyboard.press("End"); await page.waitForTimeout(300); console.log("after End:", await page.evaluate(()=>document.activeElement.textContent.trim()));
// skip link focus visible?
await page.keyboard.press("Shift+Tab");
await browser.close();
// forced colors shot
({ browser, page } = await open("curator", { viewport: "1024", touch: true, forcedColors: "active" }));
await go(page, `/projects/${P}/preview`); await settle(page, 3000); await shot(page, "preview__forced-colors__1024", false);
await browser.close();
// reduced motion + swipe on map in POI editor
({ browser, page } = await open("curator", { viewport: "1024", touch: true, reducedMotion: "reduce" }));
const cdp = await page.context().newCDPSession(page);
await go(page, `/projects/${P}/pois/${POI}`); await settle(page, 2500);
const map = page.locator(".leaflet-container").first(); await map.scrollIntoViewIfNeeded(); const b = await map.boundingBox();
const sc = () => page.evaluate(()=>{const m=[...document.querySelectorAll("*")].find(e=>e.scrollTop>0&&e.scrollHeight>e.clientHeight+50); return m?m.scrollTop:window.scrollY;});
const before = await sc(); const c0 = await page.evaluate(()=>document.querySelector(".leaflet-container ._x")?0:0);
const x=b.x+b.width/2; let y=b.y+b.height-30;
await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
for (let i=1;i<=10;i++){ await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x,y:y-i*12}]}); await page.waitForTimeout(16); }
await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]}); await page.waitForTimeout(500);
console.log("vertical swipe over map: page scrolled", (await sc())-before, "px");
await browser.close();
