import { start, go, P } from "./common.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const s = await start("1440"); const { page } = s;
for (const k of kinds) {
  await go(page, `${P}/${k}`);
  await page.waitForSelector("tbody tr"); await page.waitForTimeout(400);
  const btn = page.getByRole("button", { name: /^New /i }).first();
  await btn.click(); await page.waitForTimeout(500);
  const dlg = page.getByRole("dialog");
  console.log(k, "DIALOG:", await dlg.evaluate(d=>({text:d.innerText.replace(/\n+/g," | "), fields:[...d.querySelectorAll("input,select,textarea")].map(e=>`${e.tagName}[${e.type}] id=${e.id} req=${e.required} lbl=${(e.labels?.[0]?.innerText||e.getAttribute("aria-label")||"").slice(0,40)}`), focus:document.activeElement.tagName+":"+(document.activeElement.id||document.activeElement.innerText.slice(0,20))})));
  await s.shot(`${k}__create-open`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  console.log(k,"after Esc dialog count", await page.getByRole("dialog").count(), "focus:", await page.evaluate(()=>document.activeElement.innerText?.slice(0,30)));
  await btn.click(); await page.waitForTimeout(300);
  await dlg.getByRole("button", { name: /^(create|add|save)/i }).last().click(); await page.waitForTimeout(500);
  console.log(k,"EMPTY SUBMIT:", await dlg.evaluate(d=>({text:d.innerText.replace(/\n+/g," | ").slice(0,500), focus:document.activeElement.tagName+":"+(document.activeElement.id||document.activeElement.innerText.slice(0,20)), invalid:[...d.querySelectorAll("[aria-invalid=true]")].map(e=>e.id)})));
  await s.shot(`${k}__create-empty-submit`);
  await page.keyboard.press("Escape");
}
await s.browser.close();
