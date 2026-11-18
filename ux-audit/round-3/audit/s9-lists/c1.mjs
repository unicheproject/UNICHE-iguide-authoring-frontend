import { open, go, P, shot, settle, KINDS } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
for (const k of KINDS) {
  await go(page, `/projects/${P}/${k}`); await settle(page, 1800);
  await page.locator("main h1 ~ * button, main button").filter({ hasText: /^New / }).first().click(); await settle(page, 700);
  const d = await page.evaluate(() => {
    const dlg = document.querySelector("[role=dialog]");
    const b = dlg.getBoundingClientRect();
    const fields = [...dlg.querySelectorAll("input,select,textarea,[role=radio],[role=combobox],button[aria-expanded]")].map(f => {
      const lab = f.labels && f.labels[0] ? f.labels[0].innerText.trim().replace(/\n/g," ") : (f.getAttribute("aria-label")||"");
      const r = f.getBoundingClientRect();
      return `${f.tagName}${f.type?"/"+f.type:""}${f.getAttribute("role")?"/"+f.getAttribute("role"):""} "${lab}" val="${(f.value||"").slice(0,20)}" req=${f.required||f.getAttribute("aria-required")||""} w=${Math.round(r.width)} h=${Math.round(r.height)} chk=${f.checked??""}`;
    });
    return { name: dlg.getAttribute("aria-label")||dlg.getAttribute("aria-labelledby"), r: [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)], text: dlg.innerText.replace(/\n+/g," | "), fields, focus: document.activeElement.tagName+":"+(document.activeElement.labels?.[0]?.innerText||document.activeElement.getAttribute("aria-label")||"") };
  });
  console.log("==", k, JSON.stringify(d, null, 1));
  await shot(page, `${k}__create-dialog__1440`);
  // submit empty
  const sub = page.locator("[role=dialog] button[type=submit], [role=dialog] button").filter({ hasText: /^Create|^Add/ }).last();
  console.log("submit btn", await sub.innerText(), "disabled", await sub.isDisabled());
  await sub.click(); await settle(page, 700);
  const v = await page.evaluate(() => { const dlg = document.querySelector("[role=dialog]"); return { alert: [...dlg.querySelectorAll("[role=alert]")].map(a => a.innerText.replace(/\n+/g," | ")), invalid: [...dlg.querySelectorAll("[aria-invalid=true]")].map(i => i.id + ":" + (i.getAttribute("aria-describedby")||"")), focus: document.activeElement.tagName + ":" + (document.activeElement.labels?.[0]?.innerText || document.activeElement.innerText || "").slice(0,40), still: !!dlg }; });
  console.log("empty submit:", JSON.stringify(v));
  await shot(page, `${k}__create-dialog-empty-submit__1440`);
  await page.keyboard.press("Escape"); await settle(page, 400);
  console.log("esc ->", await page.evaluate(() => ({ dlg: !!document.querySelector("[role=dialog]"), focus: (document.activeElement.innerText||document.activeElement.getAttribute("aria-label")||document.activeElement.tagName).slice(0,30) })));
}
await browser.close();
