import { start, go, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const cfg = {
  places:["New place","place"], pois:["New point","poi"], routes:["New route","route"], guides:["New guide","guide"], events:["New event","event"], categories:["New category","category"]};
for (const [k,[btn,id]] of Object.entries(cfg)) {
  await go(page, `${P}/${k}`); await page.waitForSelector("tbody tr"); await page.waitForTimeout(300);
  await page.getByRole("button",{name:new RegExp("^"+btn,"i")}).click(); await page.waitForTimeout(300);
  if (k==="places") await page.getByRole("button",{name:/Top-level place/}).click();
  if (k==="routes") await page.getByRole("button",{name:/Outdoor/}).click();
  const t = page.locator(`#${id}-title, #${id}-name`);
  await t.fill(`UX-s9-lists ${k}`);
  if (k==="categories") await page.locator("#category-code").fill("ux-s9-lists-category");
  console.log(k,"slug", await page.locator(`#${id}-slug, #${id}-code`).first().inputValue().catch(()=>"?"));
  await s.shot(`${k}__create-valid-filled`);
  const before = page.url();
  await page.getByRole("dialog").getByRole("button",{name:/^create/i}).click();
  await page.waitForTimeout(1800);
  const toast = await page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert],[aria-live]")].map(e=>e.innerText.trim()).filter(Boolean).join(" || "));
  console.log(k,"AFTER URL:", page.url().replace(P,""), "dialogs:", await page.getByRole("dialog").count(), "toast:", toast, "focus:", await page.evaluate(()=>document.activeElement.tagName+":"+(document.activeElement.innerText||"").slice(0,30)));
  await s.shot(`${k}__after-create`);
}
await s.browser.close();
