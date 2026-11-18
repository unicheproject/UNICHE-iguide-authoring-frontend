import { open, go, P, shot, settle, SH } from "./h.mjs";
const vp = process.argv[2] || "1440";
const { browser, context, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/pois`); await settle(page, 1500);
await page.getByRole("link", { name: /Parthenon Frieze – North Side/ }).first().click(); await settle(page, 2500);
console.log("url", page.url());
const copyBtns = await page.getByRole("button", { name: /copy/i }).allInnerTexts();
console.log("copy buttons", copyBtns, await page.getByRole("button", { name: /copy/i }).evaluateAll(es => es.map(e => e.getAttribute("aria-label")||e.textContent.trim())));
async function toastState(tag) {
  const m = await page.evaluate(() => {
    const t = [...document.querySelectorAll(".z-toast > div")];
    const rt = document.querySelector(".z-toast"); const rb = rt?.getBoundingClientRect();
    const form = document.querySelector("main form, main [data-editor-form], main section");
    return { stack: rb && [rb.left, rb.top, rb.right, rb.bottom].map(Math.round), vw: innerWidth, vh: innerHeight, toasts: t.map(x => { const b = x.getBoundingClientRect(), cs = getComputedStyle(x); return { role: x.getAttribute("role"), txt: x.innerText.replace(/\n/g, " | ").slice(0, 120), box: [b.left,b.top,b.width,b.height].map(Math.round), rad: cs.borderRadius, pad: cs.padding, sh: cs.boxShadow.slice(-60), anim: x.getAnimations().map(a => a.animationName || a.constructor.name) }; }), insetVar: getComputedStyle(document.documentElement).getPropertyValue("--toast-inset-right"), offVar: getComputedStyle(document.documentElement).getPropertyValue("--toast-offset-bottom"),
      cols: [...document.querySelectorAll("main *")].filter(e=>/On this page|What needs attention/.test(e.textContent) && e.children.length<3 && e.textContent.length<30).slice(0,2).map(e=>{const b=e.getBoundingClientRect(); return [e.textContent.trim(), Math.round(b.left)]}) };
  });
  console.log("TOAST", tag, JSON.stringify(m));
}
await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(()=>{});
// success
const btn = page.getByRole("button", { name: "Copy link" }).first();
await btn.scrollIntoViewIfNeeded().catch(()=>{});
await btn.click().catch(e => console.log("click fail", e.message.slice(0,80)));
await settle(page, 500); await toastState("success-0.5s"); await shot(page, `toast__link-copied__${vp}`);
const t0 = Date.now();
// hover pause
await page.mouse.move(0, 0);
await settle(page, 3000);
const box = await page.locator(".z-toast > div").first().boundingBox().catch(()=>null);
if (box) { await page.mouse.move(box.x + 20, box.y + 20); }
await settle(page, 4000);
console.log("after hover 7.5s total, toasts:", await page.locator(".z-toast > div").count());
await page.mouse.move(0, 0); await settle(page, 5600);
console.log("after leaving, toasts:", await page.locator(".z-toast > div").count());
// warning: deny clipboard
await context.clearPermissions();
await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("no")) }, configurable: true }); });
await btn.click(); await settle(page, 400); await toastState("warning");
await shot(page, `toast__warning__${vp}`);
await settle(page, 9000); console.log("warning after 9.4 s:", await page.locator(".z-toast > div").count());
// identical stacking
for (let i = 0; i < 3; i++) await btn.click();
await settle(page, 400); await toastState("collapsed x3"); await shot(page, `toast__collapsed__${vp}`);
await page.keyboard.press("Tab"); 
console.log("focus after click", await page.evaluate(() => document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.trim().slice(0, 30)));
// dismiss button
const dis = page.getByRole("button", { name: "Dismiss notification" });
await dis.first().focus(); await shot(page, `toast__dismiss-focus__${vp}`);
const dm = await dis.first().evaluate(e => { const cs = getComputedStyle(e), b = e.getBoundingClientRect(); return { size: [b.width, b.height], ow: cs.outlineWidth, oc: cs.outlineColor, oo: cs.outlineOffset, sh: cs.boxShadow.slice(0,60) }; });
console.log("dismiss focus", JSON.stringify(dm));
await page.keyboard.press("Enter"); await settle(page, 300);
console.log("after dismiss focus ->", await page.evaluate(() => document.activeElement.tagName + ":" + (document.activeElement.getAttribute("aria-label") || document.activeElement.textContent.trim().slice(0, 30))));
await browser.close();
