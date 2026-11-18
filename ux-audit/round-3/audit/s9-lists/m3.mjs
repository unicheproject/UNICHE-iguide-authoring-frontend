import { open, go, P, shot, settle, KINDS } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]); };
for (const k of KINDS) {
  await go(page, `/projects/${P}/${k}`); await settle(page, 2000);
  for (const idx of [0, 3]) {
    const btn = page.locator("main table tbody tr").nth(idx).locator("button[aria-label^='Actions for']");
    await btn.focus();
    const kb = await btn.evaluate(e => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
    await page.keyboard.press("Enter"); await settle(page, 500);
    const info = await page.evaluate(() => {
      const items = [...document.querySelectorAll("[role=menuitem]")];
      const f = document.activeElement;
      const cs = getComputedStyle(f);
      // background: walk up
      let bg = "", el = f; while (el) { const c = getComputedStyle(el).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)/.test(c) && c !== "transparent") { bg = c; break; } el = el.parentElement; }
      return { items: items.map(i => (i.innerText||"").trim() + (i.getAttribute("aria-disabled")==="true"?" [disabled]":"") + (i.hasAttribute("data-highlighted")?" *":"")), focus: (f.innerText||"").trim(), fg: cs.color, bg, fbg: cs.backgroundColor, menuR: (()=>{const m=document.querySelector("[role=menu]"); if(!m) return null; const b=m.getBoundingClientRect(); return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)];})(), outline: cs.outlineStyle+" "+cs.outlineWidth+" "+cs.outlineColor };
    });
    console.log(k, idx, "kebab", kb, JSON.stringify(info));
    if (idx === 0) await shot(page, `${k}__rowmenu__1440`);
    await page.keyboard.press("Escape"); await settle(page, 300);
    console.log("   esc focus:", await page.evaluate(() => document.activeElement.getAttribute("aria-label")));
  }
}
await browser.close();
