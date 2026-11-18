import { start, go, P } from "./common.mjs";
const s = await start("1440"); const { page } = s;
const toastText = async()=>page.evaluate(()=>[...document.querySelectorAll("[role=status],[role=alert]")].map(e=>e.innerText.trim().replace(/\n+/g," ")).filter(Boolean).join(" || "));
for (const k of ["places","pois","routes","guides","events","categories"]) {
  await go(page, `${P}/${k}`); await page.waitForSelector("tbody tr"); await page.waitForTimeout(400);
  const row = ()=>page.locator("tbody tr").filter({hasText:`UX-s9-lists ${k}`});
  console.log(k,"my row count", await row().count());
  await row().scrollIntoViewIfNeeded();
  await s.shot(`${k}__my-row-in-list`);
  await row().getByRole("button",{name:/^activate$/i}).click(); await page.waitForTimeout(1500);
  console.log(k,"ACTIVATE =>", page.url().replace(P,""), "|", await toastText());
  await s.shot(`${k}__activate-result`);
  if (!page.url().includes(`/${k}/`)) {
    // activated in place
    await row().getByRole("button",{name:/^deactivate$/i}).click(); await page.waitForTimeout(800);
    console.log(k,"DEACT DIALOG:", (await page.getByRole("dialog").innerText()).replace(/\n+/g," | "), "focus:", await page.evaluate(()=>document.activeElement.innerText));
    await s.shot(`${k}__deactivate-confirm`);
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    console.log(k,"after Esc focus:", await page.evaluate(()=>document.activeElement.tagName+":"+document.activeElement.innerText));
    await row().getByRole("button",{name:/^deactivate$/i}).click(); await page.waitForTimeout(500);
    await page.getByRole("dialog").getByRole("button",{name:/^deactivate$/i}).click(); await page.waitForTimeout(1200);
    console.log(k,"DEACTIVATED:", await toastText());
  } else { await go(page, `${P}/${k}`); await page.waitForSelector("tbody tr"); }
  await row().getByRole("button",{name:/^archive$/i}).click(); await page.waitForTimeout(800);
  console.log(k,"ARCHIVE DIALOG:", (await page.getByRole("dialog").innerText()).replace(/\n+/g," | "));
  await s.shot(`${k}__archive-confirm`);
  await page.getByRole("dialog").getByRole("button",{name:/^archive$/i}).click(); await page.waitForTimeout(1200);
  console.log(k,"ARCHIVED:", await toastText(), "| row now:", (await row().innerText()).replace(/\n+/g," | ").slice(0,200));
  await s.shot(`${k}__archived-row`);
}
await s.browser.close();
