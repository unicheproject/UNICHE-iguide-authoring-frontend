import { open, go, shot, P, settle } from "./lib.mjs";
const ID="061eca49-e97e-483a-b48f-3dff0d96a3cc";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${ID}`);
await page.getByRole("heading", { level: 1 }).first().waitFor(); await settle(page,1200);
await page.getByRole("button",{name:/^Show|Practical details/}).click(); await settle(page,400);
await shot(page,"poi-editor__practical-details-open__1440");
for (const lang of ["English","Ελληνικά","Italiano"]) {
  await page.getByRole("tab",{name:new RegExp(lang)}).click(); await settle(page,400);
  const panel=page.getByRole("tabpanel");
  const fields=panel.locator("textarea:not([readonly]):not([disabled]), input[type=text]:not([readonly]):not([disabled])");
  const n=await fields.count(); console.log(lang,"fields",n);
  for(let i=0;i<n;i++){ const f=fields.nth(i); const v=await f.inputValue(); const lab=await f.getAttribute("id"); if(!v){ await f.fill(`R2 ${lang} text ${i+1}`);} }
  const showb=panel.getByRole("button",{name:/^Show|Practical details/}); if(await showb.count()){ await showb.click(); await settle(page,300); const f2=panel.locator("textarea:not([readonly]), input[type=text]:not([readonly])"); for(let i=0;i<await f2.count();i++){ if(!(await f2.nth(i).inputValue())) await f2.nth(i).fill(`R2 ${lang} detail ${i}`)} }
}
console.log("readiness:", await page.getByRole("region",{name:/before you activate|needs attention/i}).innerText().catch(()=>"?"));
await shot(page,"poi-editor__all-texts-filled__1440");
const t0=Date.now();
await page.getByRole("button",{name:/save and activate|^activate$/i}).first().click(); await settle(page,800);
const d=page.getByRole("dialog"); console.log("DIALOG:", await d.innerText());
await shot(page,"poi-activate-confirm__clean__1440");
await d.getByRole("button",{name:/activate/i}).last().click();
await page.waitForFunction(()=>!document.querySelector("[role=dialog]"),null,{timeout:30000});
console.log("save+activate ms", Date.now()-t0);
await settle(page,800);
await shot(page,"poi-editor__activated__1440");
console.log("TOASTS:", await page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert],[aria-live]")].map(e=>e.textContent.trim().slice(0,160)).filter(Boolean)));
console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,100)));
console.log((await page.locator("main").innerText()).slice(0,400));
await browser.close();
