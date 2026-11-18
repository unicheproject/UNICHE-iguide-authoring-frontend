import { open, go, shot, POP, run, axe, focusDesc, log, start } from "./lib.mjs";
import { readFileSync } from "node:fs";
const PLAN = JSON.parse(readFileSync(new URL("./ids.json", import.meta.url))).plan;
const vp = process.argv[2] || "1024"; const touch = process.argv[3] === "touch";
await run(async () => { try {
  const { browser, page } = await start(vp, { touch }); log("=== f1 plan editor", vp, touch ? "touch" : "mouse");
  await go(page, `/projects/${POP}/floor-plans/${PLAN}`); await page.waitForTimeout(2500);
  const tag = (s) => `${s}${touch ? "-touch" : ""}`;
  await shot(page, tag("plan-editor__default"), vp, true);
  const vw = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
  const placeBtns = page.locator('#placed ul button, section ul button:has-text("Place")');
  log("Place buttons", await page.locator('button:has-text("Place")').count(), "sample names", await page.locator('ul button:has-text("Place")').evaluateAll(b => b.slice(0,3).map(x=>x.textContent.trim())));
  log("Place btn size", await page.locator('ul button:has-text("Place")').first().evaluate(e=>{const b=e.getBoundingClientRect();return Math.round(b.width)+"x"+Math.round(b.height)}));
  const first = page.locator('ul button:has-text("Place")').first(); await first.scrollIntoViewIfNeeded();
  const act = touch ? "tap" : "click";
  await first[act](); await page.waitForTimeout(600);
  const bar = page.locator("[data-armed-bar]");
  log("armed bar", await bar.evaluate((e, vw) => { const b = e.getBoundingClientRect(); const plane = document.querySelector(".plan-plane").getBoundingClientRect(); const ov = Math.max(0, Math.min(b.bottom, plane.bottom) - Math.max(b.top, plane.top)); const visBar = Math.max(0, Math.min(b.bottom, vw.h) - Math.max(b.top, 0)); return { text: e.innerText.replace(/\n+/g," | "), rect: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], pctOfViewport: Math.round(100 * b.width * visBar / (vw.w * vw.h)), overlapPlanePx: Math.round(ov), planeRect: [Math.round(plane.x), Math.round(plane.y), Math.round(plane.width), Math.round(plane.height)], position: getComputedStyle(e).position, vw }; }, vw));
  await shot(page, tag("plan-editor__armed"), vp);
  log("armed btns", await bar.locator("button").evaluateAll(b=>b.map(x=>x.innerText.trim()+" "+Math.round(x.getBoundingClientRect().width)+"x"+Math.round(x.getBoundingClientRect().height))));
  log("live", await page.evaluate(()=>[...document.querySelectorAll('[aria-live]')].map(l=>l.textContent).filter(Boolean)));
  // Place by clicking plane
  const plane = page.locator(".plan-plane"); const pb = await plane.boundingBox();
  if (touch) await page.touchscreen.tap(pb.x + pb.width*0.3, pb.y + pb.height*0.3); else await page.mouse.click(pb.x + pb.width*0.3, pb.y + pb.height*0.3);
  await page.waitForTimeout(500);
  log("after place", await page.locator(".plan-pin").count(), "live", await page.evaluate(()=>[...document.querySelectorAll('[aria-live]')].map(l=>l.textContent).filter(Boolean)));
  // Arm second, then tap on the existing pin
  await page.locator('ul button:has-text("Place")').first().scrollIntoViewIfNeeded();
  await page.locator('ul button:has-text("Place")').first()[act](); await page.waitForTimeout(500);
  const pin = page.locator(".plan-pin").first(); const pr = await pin.boundingBox();
  log("pin size", Math.round(pr.width)+"x"+Math.round(pr.height));
  const liveBefore = await page.evaluate(()=>[...document.querySelectorAll('[aria-live]')].map(l=>l.textContent).join("|"));
  if (touch) await page.touchscreen.tap(pr.x+pr.width/2, pr.y+pr.height/2); else await page.mouse.click(pr.x+pr.width/2, pr.y+pr.height/2);
  await page.waitForTimeout(500);
  log("tap on existing pin: armed still?", await bar.count(), "pins", await page.locator(".plan-pin").count(), "live changed?", liveBefore !== await page.evaluate(()=>[...document.querySelectorAll('[aria-live]')].map(l=>l.textContent).join("|")), "bar text", await bar.innerText().catch(()=>null));
  await shot(page, tag("plan-editor__armed-tap-pin"), vp);
  // Escape cancels
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  log("after Escape armed bar", await bar.count(), "live", await page.evaluate(()=>[...document.querySelectorAll('[aria-live]')].map(l=>l.textContent).filter(Boolean).slice(-1)));
  // Keyboard path: arm + place near centre x3
  for (let i=0;i<3;i++){ const b = page.locator('ul button:has-text("Place")').first(); await b.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(300); await page.getByRole("button",{name:"Place near the centre"}).click(); await page.waitForTimeout(300); }
  log("pins now", await page.evaluate(()=>[...document.querySelectorAll(".plan-pin")].map(p=>{const b=p.getBoundingClientRect(); return `${p.getAttribute("aria-label").slice(0,30)} @${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`})));
  await plane.scrollIntoViewIfNeeded(); await shot(page, tag("plan-editor__placed-4"), vp);
  // Placed list rows
  log("placed list first row", await page.locator("ol:has(input) li").first().innerText().then(t=>t.replace(/\n+/g," | ")));
  log("placed values", await page.locator("ol:has(input) li input").evaluateAll(i=>i.slice(0,6).map(x=>x.getAttribute("aria-label")+"="+x.value)));
  // drag shift: move a pin by mouse and measure layout
  if (!touch) {
    const rectsBefore = await page.evaluate(()=>({sh:document.scrollingElement.scrollHeight, planeH: document.querySelector(".plan-plane").getBoundingClientRect().height, top: Math.round(document.querySelector("[data-armed-bar]")?.getBoundingClientRect().top ?? -1)}));
    const p0 = await page.locator(".plan-pin").first().boundingBox(); const pbx = await plane.boundingBox();
    await page.mouse.move(p0.x+p0.width/2, p0.y+p0.height/2); await page.mouse.down();
    const mid = [];
    for (let i=1;i<=8;i++){ await page.mouse.move(p0.x+p0.width/2+i*20, p0.y+p0.height/2+i*12); await page.waitForTimeout(30); mid.push(await page.evaluate(()=>[Math.round(document.scrollingElement.scrollHeight), Math.round(document.querySelector(".plan-plane").getBoundingClientRect().height)])); }
    await shot(page, tag("plan-editor__dragging"), vp);
    await page.mouse.up(); await page.waitForTimeout(300);
    log("drag layout (scrollHeight, planeH) before", rectsBefore, "during", mid.map(m=>m.join("/")).join(" "), "after", await page.evaluate(()=>[document.scrollingElement.scrollHeight, document.querySelector(".plan-plane").getBoundingClientRect().height]));
    log("x/y after drag", await page.locator("ol:has(input) li").first().locator("input").evaluateAll(i=>i.map(x=>x.value)));
  }
  await axe(page, "plan editor "+vp);
  await browser.close();
} catch(e){ log("FAIL", e.message.slice(0,600)); } });
