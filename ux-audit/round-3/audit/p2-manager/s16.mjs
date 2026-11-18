import { open, go } from "../../../tools/session.mjs";
import { shot } from "./lib.mjs";
const ID="600c4311-3e81-4235-91b0-5b3e336918fc", POP="6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: "1440" });
async function hints(label, path, extra) {
  await go(page, path); await page.waitForTimeout(2500);
  if (extra) await extra();
  const bs = page.locator("button[aria-label^='What'], button[aria-label^='Why'], button[aria-label^='About'], button[aria-label^='How']");
  const n = await bs.count(); console.log("==", label, "hint buttons:", n);
  for (let i=0;i<n;i++){ const b=bs.nth(i); const lab=await b.getAttribute("aria-label"); const box=await b.boundingBox(); if(!box) continue;
    await b.scrollIntoViewIfNeeded().catch(()=>{}); await b.click({timeout:3000}).catch(()=>{}); await page.waitForTimeout(350);
    const t = await page.evaluate(()=>{const p=[...document.querySelectorAll("[data-radix-popper-content-wrapper]")].pop(); if(!p) return null; const r=p.getBoundingClientRect(); return {txt:p.innerText, w:Math.round(r.width), h:Math.round(r.height)}});
    console.log(JSON.stringify({lab, size:[box.width,box.height], t}));
    if (i===0) await shot(page, `helphint__${label}__1440`);
    await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  }
}
await hints("dashboard-populated", "/projects/"+POP);
await hints("dashboard-mine", "/projects/"+ID);
await hints("poi-list-mine", "/projects/"+ID+"/pois");
await go(page, "/projects/"+ID+"/pois"); await page.waitForTimeout(1500);
const href = await page.evaluate(()=>[...document.querySelectorAll("a")].find(a=>/pois\/[0-9a-f-]{36}/.test(a.href))?.href);
console.log("poi href", href);
await hints("poi-editor-draft", href.replace("http://localhost:5173",""));
await browser.close();
