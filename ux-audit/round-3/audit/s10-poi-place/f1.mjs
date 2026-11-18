import { open, go, shot, settle, path } from "./lib2.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
const foc = () => page.evaluate(()=>{const a=document.activeElement;return `${a.tagName}#${a.id}.${a.getAttribute("aria-label")||""} "${(a.textContent||"").trim().slice(0,30)}"`});
try {
  await go(page, path("poiB")); await settle(page,2000);
  // Next missing (side card)
  await page.getByRole("button",{name:/Next missing/}).first().click(); await settle(page,600);
  console.log("next missing ->", await foc(), "practical expanded:", await page.getByRole("button",{name:/practical details/i}).getAttribute("aria-expanded"));
  await shot(page,"poiB__next-missing-click__1440");
  // Greek tab
  await page.getByRole("tab",{name:/Ελληνικά/}).click(); await settle(page,600);
  await shot(page,"poiB__greek-tab__1440");
  console.log("greek tab main text:", (await page.locator("main").innerText()).slice(0,900));
  console.log("focus after tab click", await foc());
  // Next missing from header region under greek
  const nm = page.getByRole("button",{name:/Next missing/}); console.log("next missing buttons", await nm.count(), await nm.allInnerTexts());
  await nm.first().click(); await settle(page,600); console.log("greek next missing ->", await foc());
  await shot(page,"poiB__greek-next-missing__1440");
  // Type greek
  await page.keyboard.type("Ο Παρθενώνας");
  await settle(page,300);
  await page.getByRole("tab",{name:/English/}).click(); await settle(page,300);
  // Discard
  console.log("banner:", await page.locator(".editor-banner").innerText());
  await page.getByRole("button",{name:/Discard changes/}).first().click(); await settle(page,700);
  await shot(page,"poiB__discard-dialog__1440");
  console.log("discard dlg:", await page.getByRole("dialog").count() ? await page.getByRole("dialog").innerText() : "no dialog");
  console.log("focus", await foc());
  const dlg = page.getByRole("dialog");
  if (await dlg.count()) { await dlg.getByRole("button",{name:/discard/i}).last().click(); await settle(page,900); }
  await shot(page,"poiB__after-discard__1440");
  console.log("focus after discard", await foc());
  console.log("toasts:", await page.locator("[role=status],[role=alert],[data-toast],li[class*=toast]").evaluateAll(e=>e.map(x=>x.className.toString().slice(0,40)+"|"+x.innerHTML.slice(0,300))));
} finally { await browser.close(); }
