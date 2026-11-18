import { open, go, shot, POP, axe, t, focusDesc } from "./lib.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${POP}/pois/546c5177-effd-49c8-acae-85d751f89bbe`); await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2500);
await page.getByRole("button",{name:/Add primary image/}).first().evaluate(e=>e.click()); await page.waitForTimeout(1500);
console.log("focus", await focusDesc(page));
const dlg = page.locator("[role=dialog]").last();
const m = await page.evaluate(()=>{const d=[...document.querySelectorAll("[role=dialog]")].pop(); const r=d.getBoundingClientRect(); const first=[...d.querySelectorAll("img")][0]?.getBoundingClientRect(); return {h:Math.round(r.height), vh:innerHeight, firstTileTop: first?Math.round(first.top):null, scrollers:[...d.querySelectorAll("*")].filter(e=>e.scrollHeight>e.clientHeight+10&&getComputedStyle(e).overflowY!=="visible").map(e=>e.tagName+"."+(e.className+"").slice(0,20))}});
console.log(JSON.stringify(m)); await shot(page,"picker__open",vp);
if (vp==="1440") {
 const seq=[]; for (let i=0;i<14;i++){ await page.keyboard.press("Tab"); const d=await focusDesc(page); seq.push(d.slice(0,35)); if(/png|jpg|Image ·/.test(d) || /^(a|li|div|button) "[^"]*·/.test(d)) { console.log("tile reached after tabs:", i+1); break; } } console.log("tabs", seq);
 // arrows
 const a=[]; for (const k of ["ArrowRight","ArrowRight","ArrowDown","ArrowLeft","Home","End"]) { await page.keyboard.press(k); a.push(k+" -> "+(await focusDesc(page)).slice(0,40)); } console.log(a);
 await page.keyboard.press("Home"); await page.keyboard.press("Space"); await page.waitForTimeout(400);
 console.log("status", await dlg.locator("[role=status]").allInnerTexts());
 await shot(page,"picker__selected",vp);
 // use this image via keyboard
 await page.getByRole("button",{name:/Use this image/}).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(1500);
 console.log("dialogs", await page.locator("[role=dialog]").count(), "focus after use:", await focusDesc(page));
 console.log("live", (await page.locator("[role=status],[aria-live]").allInnerTexts()).filter(x=>x.trim()));
 await shot(page,"poi-editor__after-use-image",vp);
 // discard pending: do not save
} else {
 await page.keyboard.press("Escape"); await page.waitForTimeout(400); console.log("after esc focus", await focusDesc(page));
}
await browser.close();
