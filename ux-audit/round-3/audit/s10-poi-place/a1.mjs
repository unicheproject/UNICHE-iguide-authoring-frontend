import { open, go, P, shot, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
try {
  await go(page, `/projects/${P}/pois?create=1`); await settle(page,1500);
  await shot(page, "poi-create-dialog__default__1440");
  const dlg = page.getByRole("dialog");
  console.log(await dlg.innerText());
  console.log(await dlg.locator("input,select,button,textarea").evaluateAll(els=>els.map(e=>e.tagName+":"+(e.getAttribute("aria-label")||e.id||e.textContent.trim().slice(0,30)))));
} finally { await browser.close(); }
