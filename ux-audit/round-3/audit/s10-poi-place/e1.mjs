import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const btns = () => page.evaluate(()=>[...document.querySelectorAll("main button")].filter(b=>/save|apply|discard/i.test(b.textContent)&&b.getBoundingClientRect().width).map(b=>{const r=b.getBoundingClientRect();const cs=getComputedStyle(b);return `${b.textContent.trim().slice(0,30)} | ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.x)},${Math.round(r.y)} bg ${cs.backgroundColor} aria-disabled ${b.getAttribute("aria-disabled")} disabled ${b.disabled}`}));
try {
  await go(page, path("poiB")); await settle(page,2000);
  console.log("clean:", await btns());
  const s = page.locator("#f-summary"); await s.click(); await page.keyboard.press("End"); await page.keyboard.type(" Edited once.");
  await settle(page,500);
  await shot(page,"poiB__active-dirty__1440");
  console.log("dirty:", await btns());
  console.log(await page.locator(".editor-header").innerText());
  // Ctrl+S
  await page.keyboard.press("Control+s"); await settle(page,2500);
  await shot(page,"poiB__active-pending__1440");
  console.log("after ctrl+s:", await btns());
  console.log(await page.locator(".editor-header").innerText(), "|", await page.locator(".editor-banner").innerText());
  console.log("Status card:", await page.locator("#status-card-heading").locator("xpath=ancestor::section[1]").innerText().catch(()=>"?"));
  await page.getByRole("button",{name:/Apply changes/}).first().click(); await settle(page,800);
  await shot(page,"poiB__apply-confirm__1440");
  console.log("APPLY DIALOG:\n"+await page.getByRole("dialog").innerText());
  await page.keyboard.press("Escape"); await settle(page,400);
  console.log("focus after esc:", await page.evaluate(()=>document.activeElement.textContent.trim().slice(0,30)));
} finally { await browser.close(); }
