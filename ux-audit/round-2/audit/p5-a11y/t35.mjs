import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "zoom200" });
const k = page.keyboard;
const hscroll = () => page.evaluate(() => { const m = document.querySelector("main"); return { doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: m ? m.scrollWidth - m.clientWidth : null, vw: innerWidth, vh: innerHeight, stickyTop: [...document.querySelectorAll("*")].filter((e) => { const p = getComputedStyle(e).position; return (p === "sticky" || p === "fixed") && e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().width > innerWidth * 0.4; }).map((e) => (e.tagName + "." + [...e.classList].slice(0, 2).join(".")) + ":" + Math.round(e.getBoundingClientRect().top) + "+" + Math.round(e.getBoundingClientRect().height)) }; });
for (const [n, p] of [["dashboard", ""], ["poi-list", "/pois"], ["poi-editor", "/pois/35d91cba-d64a-43ce-9773-1e472226d028"], ["route-editor", "/routes/11d2dfe4-09fa-48b1-8b5b-494964cf3d52"], ["event-editor", "/events/b01dc48d-a833-4dfd-af71-62f355ddb3e6"], ["media", "/media"], ["maps", "/maps"], ["preview", "/preview"], ["category-editor", "/categories/ca8a9d3c-85c8-4c3a-b522-2309120772ac"]]) {
  await L.nav(page, L.P(p), 1500);
  await L.shot(page, `${n}__zoom200__zoom200`);
  L.log("t35", n, JSON.stringify(await hscroll()));
}
// event date at zoom200: cancelled toggle + remove visible?
await L.nav(page, L.P("/events/b01dc48d-a833-4dfd-af71-62f355ddb3e6"), 1500);
await page.getByRole("button", { name: /Add a date/ }).focus(); await k.press("Enter"); await page.waitForTimeout(500);
const vis = await page.evaluate(() => ["Cancelled", "Remove date 1"].map((n) => { const e = [...document.querySelectorAll("button,[role=switch],label")].find((x) => (x.getAttribute("aria-label") || x.textContent).trim().startsWith(n)); if (!e) return n + ": missing"; const r = e.getBoundingClientRect(); return n + ": x=" + Math.round(r.left) + "..." + Math.round(r.right) + " vw=" + innerWidth; }));
L.log("t35", "event date controls", vis);
await L.shot(page, "event-editor__date-row__zoom200");
// create dialog at zoom200
await L.nav(page, L.P("/pois"), 800);
await page.getByRole("button", { name: /new point of interest/i }).focus(); await k.press("Enter"); await page.waitForTimeout(600);
const dl = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const r = d.getBoundingClientRect(); const foot = d.querySelector("[role=contentinfo], footer"); const fr = foot?.getBoundingClientRect(); return { dlg: [Math.round(r.top), Math.round(r.bottom)], vh: innerHeight, footer: fr ? [Math.round(fr.top), Math.round(fr.bottom)] : null }; });
L.log("t35", "create dialog", dl);
await L.shot(page, "poi-create__open__zoom200");
await k.press("Escape");
// summary
await browser.close();
