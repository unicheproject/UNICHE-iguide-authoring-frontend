import { open, go, shot, settle, path } from "./lib2.mjs";
const A = await open("admin", { viewport: "1440" });
const B = await open("admin", { viewport: "1440" });
const foc = (page) => page.evaluate(()=>{const a=document.activeElement;return `${a.tagName}#${a.id} "${(a.textContent||"").trim().slice(0,40)}"`});
try {
  await go(A.page, path("poiA")); await go(B.page, path("poiA")); await settle(A.page,1500);
  // B: change summary + description and save
  await B.page.locator("#f-summary").fill("Summary by the other author."); await B.page.locator("#f-description").fill("Their description.");
  await B.page.keyboard.press("Control+s"); await settle(B.page,2500);
  // A: change summary (conflict) and instructions? (not both) -> description untouched
  await A.page.locator("#f-summary").fill("Summary by me."); await A.page.locator("#f-title").fill("UX-R3-s10 POI Draft (mine)");
  await A.page.keyboard.press("Control+s"); await settle(A.page,2500);
  await shot(A.page,"poiA__409-dialog__1440");
  const d = A.page.getByRole("dialog");
  console.log("count", await d.count());
  if (await d.count()) {
    console.log("409 DIALOG:\n"+await d.innerText());
    console.log("focus", await foc(A.page));
    console.log(await d.evaluate(e=>{const r=e.getBoundingClientRect();return `${r.width}x${r.height}`}));
    console.log("buttons", await d.locator("button").evaluateAll(b=>b.map(x=>x.textContent.trim()+"|dis:"+x.disabled+"|aria:"+x.getAttribute("aria-disabled"))));
    // try keep my changes before choosing
    const keep = d.getByRole("button",{name:/Keep my changes/}); 
    console.log("keep disabled before choice:", await keep.getAttribute("aria-disabled"), await keep.isDisabled());
    await A.page.keyboard.press("Escape"); await settle(A.page,500); console.log("after esc dialog count", await d.count(), "focus", await foc(A.page));
  }
} finally { await A.browser.close(); await B.browser.close(); }
