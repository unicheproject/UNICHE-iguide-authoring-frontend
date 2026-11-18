import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2]; const mode = process.argv[3] || "";
const { browser, page } = await open("admin", { viewport: vp, forcedColors: mode === "forced" ? "active" : "none", reducedMotion: mode === "rm" ? "reduce" : "no-preference" });
const tag = vp + (mode ? "-" + mode : "");
await go(page, `/projects/${P}/pois`); await settle(page, 1500);
await page.getByRole("button", { name: "New point of interest" }).click(); await settle(page, 700);
const m = await page.evaluate(() => { const d = document.querySelector("[role=dialog]"); const b = d.getBoundingClientRect(); const cs = getComputedStyle(d); const btns = [...d.querySelectorAll("button")].map(x => x.textContent.trim() + ":" + Math.round(x.getBoundingClientRect().bottom)); const body = [...d.querySelectorAll("*")].find(e => e.scrollHeight > e.clientHeight + 2 && ["auto","scroll"].includes(getComputedStyle(e).overflowY)); const bb = body?.getBoundingClientRect(); const foot = [...d.querySelectorAll("button")].find(x => /create and open/i.test(x.textContent)); const fb = foot?.getBoundingClientRect();
  return { vh: innerHeight, vw: innerWidth, box: [b.left,b.top,b.width,b.height].map(Math.round), border: cs.borderTopWidth + " " + cs.borderTopStyle + " " + cs.borderTopColor, outline: cs.outlineStyle + cs.outlineWidth, bodyScrolls: !!body, bodyH: bb && Math.round(bb.height), bodyClientH: body && body.clientHeight, bodyScrollH: body?.scrollHeight, footerBottom: fb && Math.round(fb.bottom), footerVisible: fb && fb.bottom <= innerHeight && fb.top >= 0, ariaModal: d.getAttribute("aria-modal"), animations: document.getAnimations().map(a => (a.animationName || a.transitionProperty) + ":" + a.effect.getTiming().duration), backdropAnim: getComputedStyle(d.parentElement).animationName, scrim: getComputedStyle(d.parentElement).backgroundColor }; });
console.log("DLG", tag, JSON.stringify(m));
await shot(page, `dialog__create-poi__${tag}`);
// focus trap
const seq = [];
for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); seq.push(await page.evaluate(() => { const a = document.activeElement; return (a.closest("[role=dialog]") ? "in:" : "OUT:") + (a.getAttribute("aria-label") || a.textContent || a.tagName).trim().slice(0, 18); })); }
console.log("tab seq", seq.join(" > "));
await browser.close();
