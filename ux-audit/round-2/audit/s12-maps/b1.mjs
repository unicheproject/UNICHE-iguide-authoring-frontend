import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
await run(async () => {
  const { browser, context, page } = await open("admin", { viewport: "1440" });
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  // announcement capture
  await go(page, `/projects/${POP}/maps/${MAP}`);
  await page.waitForTimeout(2500);
  await page.evaluate(()=>{ window.__ann=[]; new MutationObserver(ms=>{for(const m of ms){const n=m.target.nodeType===3?m.target.parentElement:m.target; const live=n?.closest?.("[aria-live],[role=status],[role=alert]"); if(live) window.__ann.push(live.textContent.trim().slice(0,120));}}).observe(document.body,{subtree:true,childList:true,characterData:true}); });
  const pin = page.locator(".leaflet-container [aria-label^='1.']").first();
  await pin.focus(); await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(300);
  console.log("ANN pin", await page.evaluate(()=>window.__ann));
  await page.getByRole("button",{name:"Edit bounds"}).click();
  await page.waitForTimeout(500);
  await page.evaluate(()=>{window.__ann=[]});
  await page.locator(".leaflet-container [aria-label^='South-west']").first().focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  console.log("ANN corner", await page.evaluate(()=>window.__ann));
  await go(page, `/projects/${POP}/maps`); // discard
  await browser.close();

  // tile block
  const b2 = await open("admin", { viewport: "1440" });
  const p2 = b2.page;
  p2.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
  let block = true; let hits=0;
  await p2.route(/(tiles\.openfreemap\.org|tile\.openstreetmap\.org)/, r => { hits++; return block ? r.abort("failed") : r.continue(); });
  await go(p2, `/projects/${POP}/maps/${MAP}`);
  const t0=Date.now();
  await p2.waitForTimeout(500);
  await shot(p2, "map-editor__tiles-loading", "1440");
  console.log("chip@500", await p2.locator("main").first().evaluate(m=>[...m.querySelectorAll("[role=status]")].map(e=>e.textContent.trim())));
  await p2.waitForTimeout(6000);
  await shot(p2, "map-editor__tiles-failed", "1440");
  console.log("card text", await p2.locator(".leaflet-container").first().evaluate(c=>c.parentElement.innerText.slice(0,400)));
  console.log("hits", hits);
  // keyboard: is Try again reachable
  block=false;
  const retry = p2.getByRole("button",{name:/try again/i});
  console.log("retry count", await retry.count(), "size", await retry.first().boundingBox());
  await retry.first().click();
  await p2.waitForTimeout(5000);
  await shot(p2, "map-editor__tiles-recovered", "1440");
  console.log("card after", await p2.getByRole("button",{name:/try again/i}).count());
  await b2.browser.close();
});
