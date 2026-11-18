import { open, go, P, shot, settle, SH } from "./h.mjs";
const vp = process.argv[2] || "1440"; const forced = process.argv[3] === "forced"; const rm = process.argv[3] === "rm";
const { browser, page } = await open("admin", { viewport: vp, forcedColors: forced ? "active" : "none", reducedMotion: rm ? "reduce" : "no-preference" });
const tag = vp + (forced ? "-forced" : rm ? "-rm" : "");
const ae = () => page.evaluate(() => { const a = document.activeElement; return a.tagName + ":" + (a.getAttribute("aria-label") || a.textContent || "").trim().slice(0, 40); });
await go(page, `/projects/${P}/pois`); await settle(page, 1500);
await page.getByRole("button", { name: "New point of interest" }).click(); await settle(page, 700);
const info = () => page.evaluate(() => {
  const ds = [...document.querySelectorAll("[role=dialog]")]; const d = ds[ds.length - 1]; if (!d) return null;
  const b = d.getBoundingClientRect(), cs = getComputedStyle(d);
  const foot = [...d.querySelectorAll("button")].filter(x => /create|cancel|close/i.test(x.textContent)).map(x => x.getBoundingClientRect());
  const footer = foot.length ? foot[foot.length-1] : null;
  const scrollEl = [...d.querySelectorAll("*")].find(e => e.scrollHeight > e.clientHeight + 2 && ["auto","scroll"].includes(getComputedStyle(e).overflowY));
  const back = document.querySelector("[data-dialog-backdrop], .bg-black\\/40, [class*=backdrop]");
  const x = d.querySelector("button[aria-label*=lose]"); const xb = x?.getBoundingClientRect();
  const h2 = d.querySelector("h2"); const hs = h2 && getComputedStyle(h2);
  return { n: ds.length, box: [b.left, b.top, b.width, b.height].map(Math.round), vh: innerHeight, vw: innerWidth, rad: cs.borderRadius, sh: cs.boxShadow.slice(-60), border: cs.border, outline: cs.outline, h2: h2?.textContent, h2fs: hs?.fontSize, h2fw: hs?.fontWeight, xsize: xb && [xb.width, xb.height], inScroll: !!scrollEl, footerBottom: footer && Math.round(footer.bottom), footerInViewport: footer && footer.bottom <= innerHeight, focus: document.activeElement.tagName + ":" + (document.activeElement.textContent || "").trim().slice(0, 30), bodyScrollLocked: getComputedStyle(document.body).overflow, mainInert: document.querySelector("main")?.closest("[inert]") ? "inert" : document.querySelector("main")?.closest("[aria-hidden=true]") ? "aria-hidden" : "live" };
});
console.log("CREATE dialog", tag, JSON.stringify(await info()));
await shot(page, `dialog__create-poi__${tag}`);
// submit empty
await page.getByRole("button", { name: /^create/i }).last().click().catch(() => {}); await settle(page, 600);
console.log("after empty submit", JSON.stringify(await info())); await shot(page, `dialog__create-poi-invalid__${tag}`);
// type then Esc -> nested confirm?
await page.locator("[role=dialog] input").first().fill("UX-R3-s7-chrome temp"); 
await page.keyboard.press("Escape"); await settle(page, 600);
console.log("after Esc w/ typed text", JSON.stringify(await info())); await shot(page, `dialog__esc-with-text__${tag}`);
await page.keyboard.press("Escape"); await settle(page, 500);
console.log("after 2nd Esc dialogs:", await page.locator("[role=dialog]").count(), "focus", await ae());
await page.keyboard.press("Escape"); await settle(page, 400);
console.log("after 3rd Esc dialogs:", await page.locator("[role=dialog]").count(), "focus", await ae());
// animation on open
const anims = await page.evaluate(() => document.getAnimations().length);
await page.getByRole("button", { name: "New point of interest" }).click(); 
const an = await page.evaluate(() => document.getAnimations().map(a => (a.animationName || a.transitionProperty || "?") + ":" + a.effect.getTiming().duration));
console.log("open anims", an);
await browser.close();
