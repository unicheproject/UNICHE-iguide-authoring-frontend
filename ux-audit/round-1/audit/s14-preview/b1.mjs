import { start, go, P, shotDir, axe, focusInfo } from "./common.mjs";
const s = await start("1440"); const page = s.page; const out = {};
await go(page, P + "/preview"); await page.waitForTimeout(1500);
const sel = page.getByLabel("Fire trigger");
const opts = async () => await sel.locator("option").allTextContents();
out.workingOpts = await opts();
await page.getByRole("button",{name:"Live content"}).click(); await page.waitForTimeout(300);
out.liveOpts = await opts();
out.liveStatus = await page.locator("[aria-live=polite]").first().textContent();
await s.shot("preview__live-mode");
await page.getByRole("button",{name:"Working content"}).click();
// fire a QR on web
const pick = async (re) => { const o = await sel.locator("option").all(); for (const x of o) { const t = await x.textContent(); if (re.test(t)) { await sel.selectOption({label:t}); return t; } } return null; };
out.qr = await pick(/QR/); await page.waitForTimeout(500); await s.shot("preview__fired-qr-web");
out.afterFireSelect = await sel.inputValue();
// switch to Kiosk and fire a beacon
await page.getByRole("button",{name:"Kiosk",exact:true}).click(); await page.waitForTimeout(300);
out.stateAfterSurfaceSwitchText = (await page.locator("[data-preview-frame]").innerText()).slice(0,120).replace(/\n/g," | ");
out.beaconKiosk = await pick(/Beacon|BEACON/i); await page.waitForTimeout(500); await s.shot("preview__fired-beacon-kiosk");
out.beaconKioskText = (await page.locator("[data-preview-frame]").innerText()).slice(0,300).replace(/\n/g," | ");
out.geoKiosk = await pick(/Geo|Proximity/i); await page.waitForTimeout(500);
out.geoKioskText = (await page.locator("[data-preview-frame]").innerText()).slice(0,200).replace(/\n/g," | ");
// language switch persistence
await page.getByRole("button",{name:"Ελληνικά"}).click(); await page.waitForTimeout(500); await s.shot("preview__greek-kiosk");
out.greekText = (await page.locator("[data-preview-frame]").innerText()).slice(0,400).replace(/\n/g," | ");
out.greekStatus = await page.locator("[aria-live=polite]").first().textContent();
// accessibility: headings, labels
out.headings = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map(h=>h.tagName+":"+h.textContent.trim().slice(0,40)+ (h.closest("[data-preview-frame]")?" [FRAME]":"")));
out.landmarks = await page.evaluate(() => [...document.querySelectorAll("main,nav,header,footer,[role=main],[role=navigation],[role=banner]")].map(h=>h.tagName+(h.closest("[data-preview-frame]")?" [FRAME]":"")+(h.getAttribute("aria-label")?"("+h.getAttribute("aria-label")+")":"")));
out.frameAttrs = await page.evaluate(() => { const f=document.querySelector("[data-preview-frame]"); return {outer:f.outerHTML.slice(0,200), langAttr: f.querySelector("[lang]")?.getAttribute("lang"), ariaHidden: !!f.closest("[aria-hidden]")} });
out.axe = await axe(page,"preview-greek");
// tab walk from Open in new tab across everything
await go(page, P + "/preview"); await page.waitForTimeout(1500);
await page.getByRole("button",{name:"Open in new tab"}).focus();
const walk=[]; for (let i=0;i<70;i++){ await page.keyboard.press("Tab"); const f=await focusInfo(page); walk.push(`${i+1} ${f.tag}/${f.role} "${f.name}" ${f.ring}${f.inFrame?" [FRAME]":""}`);} 
out.walk = walk;
out.firstFrameTabIndex = walk.findIndex(x=>x.includes("[FRAME]"))+1;
out.frameTabCount = walk.filter(x=>x.includes("[FRAME]")).length;
s.save("b1.json", out); console.log(JSON.stringify(out,null,1));
await s.browser.close();
