import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const MAP = "f8daa876-f2af-4552-95ae-431c96ed1b2d";
const sizes = (page, sel) => page.locator(sel).evaluateAll(es=>es.filter(e=>e.offsetParent!==null||getComputedStyle(e).position==="fixed").map(e=>{const r=e.getBoundingClientRect();return `${(e.getAttribute("aria-label")||e.textContent||"").trim().slice(0,28)} ${Math.round(r.width)}x${Math.round(r.height)}`}));
await run(async () => {
  for (const vp of ["1024","768"]) {
    const { browser, context, page } = await open("admin", { viewport: vp, touch: true });
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
    await go(page, `/projects/${POP}/maps/${MAP}`);
    await page.waitForTimeout(2500);
    const sm = await page.evaluate(()=>({coarse: matchMedia("(pointer: coarse)").matches, any: matchMedia("(any-pointer: coarse)").matches}));
    console.log(vp, "media", JSON.stringify(sm));
    console.log(vp, "map ctl", await sizes(page, ".leaflet-container [tabindex='0'], .leaflet-control-zoom a"));
    console.log(vp, "buttons<44", await page.evaluate(()=>[...document.querySelectorAll("main button, main a, main input, main select, main [role=checkbox]")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<44||r.width<44)}).slice(0,60).map(e=>{const r=e.getBoundingClientRect();return `${e.tagName}:${(e.getAttribute("aria-label")||e.textContent||e.id).trim().slice(0,22)} ${Math.round(r.width)}x${Math.round(r.height)}`})));
    // swipe over map: does page scroll?
    const box = await page.locator(".leaflet-container").first().boundingBox();
    const y0 = await page.evaluate(()=>scrollY + (document.querySelector("main")?.scrollTop||0));
    const sc0 = await page.evaluate(()=>{const els=[document.scrollingElement,...document.querySelectorAll("*")].filter(e=>e&&e.scrollTop>0);return els.map(e=>e.tagName+e.scrollTop)});
    const cdp = await context.newCDPSession(page);
    const cx = box.x+box.width/2, cy = Math.min(box.y+box.height-40, 700);
    await cdp.send("Input.synthesizeScrollGesture", { x: cx, y: cy, yDistance: -250, speed: 800, gestureSourceType: "touch" });
    await page.waitForTimeout(600);
    const sc1 = await page.evaluate(()=>{const els=[document.scrollingElement,...document.querySelectorAll("*")].filter(e=>e&&e.scrollTop>0);return els.map(e=>e.tagName+e.scrollTop)});
    const bounds = await page.evaluate(()=>getComputedStyle(document.querySelector(".leaflet-container")).touchAction);
    console.log(vp, "swipe over map: scroll before", sc0, "after", sc1, "touch-action", bounds, "map box", JSON.stringify(box));
    // swipe over non-map area
    await cdp.send("Input.synthesizeScrollGesture", { x: 30, y: 300, yDistance: -250, speed: 800, gestureSourceType: "touch" });
    await page.waitForTimeout(500);
    console.log(vp, "swipe elsewhere", await page.evaluate(()=>{const els=[document.scrollingElement,...document.querySelectorAll("*")].filter(e=>e&&e.scrollTop>0);return els.map(e=>e.tagName+e.scrollTop)}));
    await page.evaluate(()=>{document.scrollingElement.scrollTo(0,0); document.querySelectorAll("*").forEach(e=>{if(e.scrollTop>0)e.scrollTop=0})});
    // tap Edit bounds
    await page.getByRole("button",{name:"Edit bounds"}).tap();
    await page.waitForTimeout(800);
    await shot(page, "map-editor__touch-edit-bounds", vp);
    console.log(vp, "edit handles", await sizes(page, ".leaflet-container [tabindex='0']"));
    // Place buttons size
    console.log(vp, "place btn", await page.getByRole("button",{name:/^Place .* on the map$/}).first().boundingBox());
    await browser.close();
  }
});
