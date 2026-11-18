import { open, go, CMS, VIEWPORTS } from "../../../tools/session.mjs";
export { open, go, CMS, VIEWPORTS };
export const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
export const B = "1d6971ce-6391-4da8-848e-8d7466d25128";
export const D = "f56e8c75-94af-4c87-88c8-06cba46240a1";
export const T = "600c4311-3e81-4235-91b0-5b3e336918fc";
export const SH = new URL("./shots/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
export const shot = (page, n, full = true) => page.screenshot({ path: SH + n + ".png", fullPage: full }).catch(e => console.log("shotfail", n, e.message));
export const settle = (page, ms = 1500) => page.waitForTimeout(ms);
export const dash = (id) => `/projects/${id}`;
/** measure helper evaluated in page */
export const measure = (page) => page.evaluate(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x*10)/10, y: Math.round(b.y*10)/10, r: Math.round(b.right*10)/10, w: Math.round(b.width*10)/10, h: Math.round(b.height*10)/10 }; };
  const secs = [...document.querySelectorAll("main section")].map(s => { const cs = getComputedStyle(s); const h = s.querySelector("h2"); return { id: s.getAttribute("aria-labelledby"), ...r(s), pad: cs.padding, radius: cs.borderRadius, shadow: cs.boxShadow.slice(0,40), h2: h && { fs: getComputedStyle(h).fontSize, fw: getComputedStyle(h).fontWeight, txt: h.textContent.trim().slice(0,40) } }; });
  const det = [...document.querySelectorAll("main details")].map(s => ({ ...r(s), cls: "details" }));
  const main = document.querySelector("main");
  return { vw: innerWidth, docW: document.documentElement.scrollWidth, main: r(main), h1: r(document.querySelector("main h1")), secs, det };
});
export const KINDS = ["places","pois","routes","guides","events","categories","assets","maps","floor-plans"];
export const emptyPage = (size = 1) => ({ content: [], page: 0, size, totalElements: 0, totalPages: 0 });
export const problem = (status, extra = {}) => ({ type: "about:blank", title: "Canary title", status, detail: "CANARY-DETAIL-SECRET internal stack trace", requestId: "req-r3-s8-" + status, ...extra });
/** rule(path, search) -> undefined (pass) | {json,status?} | "hold" ; hold released by calling release() */
export async function mock(page, projectId, rule) {
  const holds = [];
  await page.route(new RegExp(`/api/v1/projects/${projectId}(/|\\?|$)`), async (route) => {
    const u = new URL(route.request().url());
    const sub = u.pathname.split(projectId)[1] || "";
    const res = await rule(sub, u.search, route.request().method());
    if (!res) return route.continue();
    if (res === "hold") { await new Promise(r => holds.push(r)); return route.continue(); }
    return route.fulfill({ status: res.status ?? 200, contentType: res.status && res.status >= 400 ? "application/problem+json" : "application/json", body: JSON.stringify(res.json) });
  });
  return () => { holds.splice(0).forEach(r => r()); };
}
export const text = (page) => page.evaluate(() => document.querySelector("main")?.innerText ?? "");
