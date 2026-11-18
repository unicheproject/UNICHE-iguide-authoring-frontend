import { open, go, P, shot, settle, IDS, url, txt } from "./lib.mjs";
const vp=process.argv[2]||"1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, url("events", IDS.event)); await settle(page,1500);
await page.locator("#occ-add").click(); await settle(page,400);
const v = async (id)=>page.locator("#"+id).inputValue();
const sum = ()=>page.locator("#occ-title-o-1").locator("..").innerText().then(s=>s.replace(/\n+/g," "));
const fieldsState = async (pref)=>page.evaluate((p)=>["day","month","year","hour","minute"].map(k=>{const e=document.getElementById(p+"-"+k);return k+"="+e.value+(e.getAttribute("aria-invalid")==="true"?"!":"")+(e.getAttribute("aria-describedby")?"["+e.getAttribute("aria-describedby")+"]":"")}).join(" "),pref);
const alerts = ()=>page.evaluate(()=>[...document.querySelectorAll("[role=alert],[aria-live]")].map(e=>e.textContent.trim()).filter(Boolean).join(" || "));
async function setf(id, val){ const l=page.locator("#"+id); await l.fill(val); }
// 1 hour 25
await setf("occ-start-o-1-hour","25"); await page.keyboard.press("Tab"); await settle(page,400);
console.log("hour25 start:", await fieldsState("occ-start-o-1"), "| end:", await fieldsState("occ-end-o-1"));
console.log("msgs:", await page.locator("#dates").innerText().then(s=>s.replace(/\n+/g," ").slice(0,500)));
console.log("alerts:", await alerts());
await shot(page,`event__hour25__${vp}`);
await setf("occ-start-o-1-hour","10");
await setf("occ-start-o-1-minute","61"); await page.keyboard.press("Tab"); await settle(page,400);
console.log("min61:", await fieldsState("occ-start-o-1"), "| end:", await fieldsState("occ-end-o-1"));
console.log("msgs:", await page.locator("#dates").innerText().then(s=>s.replace(/\n+/g," ").slice(0,400)));
await setf("occ-start-o-1-minute","00");
// 31 Feb
await setf("occ-start-o-1-day","31"); await page.locator("#occ-start-o-1-month").selectOption("2"); await setf("occ-start-o-1-year","2027"); await page.keyboard.press("Tab"); await settle(page,400);
console.log("31 Feb:", await fieldsState("occ-start-o-1"), "| end:", await fieldsState("occ-end-o-1"));
console.log("summary:", await sum());
await shot(page,`event__31feb__${vp}`);
// day 99
await setf("occ-start-o-1-day","45"); await page.keyboard.press("Tab"); await settle(page,300);
console.log("day45:", await fieldsState("occ-start-o-1"), "| end:", await fieldsState("occ-end-o-1"));
console.log("summary:", await sum());
console.log("msgs:", await page.locator("#dates").innerText().then(s=>s.replace(/\n+/g," ").slice(0,300)));
await shot(page,`event__day45__${vp}`);
// restore valid
await setf("occ-start-o-1-day","20"); await page.locator("#occ-start-o-1-month").selectOption("11"); await setf("occ-start-o-1-year","2026"); await page.keyboard.press("Tab"); await settle(page,300);
console.log("valid:", await fieldsState("occ-start-o-1"), "| end:", await fieldsState("occ-end-o-1"), await sum());
// move start keep length: set start 25 Nov 14:30, end should be 15:30 same day
await setf("occ-start-o-1-day","25"); await setf("occ-start-o-1-hour","14"); await setf("occ-start-o-1-minute","30"); await page.keyboard.press("Tab"); await settle(page,300);
console.log("moved:", await fieldsState("occ-end-o-1"), await sum());
// end before start on leave
await setf("occ-end-o-1-hour","9"); await page.keyboard.press("Tab"); await settle(page,400);
console.log("end<start:", await fieldsState("occ-end-o-1"));
console.log("msgs:", await page.locator("#dates").innerText().then(s=>s.replace(/\n+/g," ").slice(0,500)));
console.log("alerts:", await alerts());
await shot(page,`event__end-before-start__${vp}`);
await browser.close();
