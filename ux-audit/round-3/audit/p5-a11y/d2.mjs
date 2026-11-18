import * as H from "./h.mjs";
const log = H.LOG("d2");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/guides")); await page.getByRole("searchbox").fill("UX-R3-p5 Guide"); await H.sleep(900);
  await page.getByRole("link", { name: "UX-R3-p5 Guide" }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(2200);
  await page.getByRole("button", { name: "Add paragraph" }).focus(); await H.press(page, "Enter", "add paragraph", log, 700);
  await page.keyboard.type("First paragraph of the R3 story.", { delay: 5 });
  await page.getByRole("button", { name: "Add heading" }).focus(); await H.press(page, "Enter", "add heading", log, 700);
  await page.keyboard.type("Heading block", { delay: 5 });
  await page.getByRole("button", { name: "Add paragraph" }).focus(); await H.press(page, "Enter", "add paragraph 2", log, 700);
  await page.keyboard.type("Second paragraph.", { delay: 5 });
  await H.shot(page, "guide-editor__3-blocks__1440");
  await H.snap(page, "guide-blocks", "main");
  log("block buttons", await page.evaluate(() => [...document.querySelectorAll("main button")].map(b => (b.getAttribute("aria-label") || b.textContent.trim()).slice(0, 60)).filter(t => /block|Move|Remove|Position|Drag/i.test(t))));
  await page.keyboard.press("Control+s"); await H.sleep(1800); await H.live(page);
  const rm = page.getByRole("button", { name: /^Remove/ }); log("remove count", await rm.count());
  await rm.nth(1).focus(); await H.press(page, "Enter", "remove block 2", log, 700);
  await H.shot(page, "guide-editor__removed-undo__1440");
  log("chk", JSON.stringify(await H.chk(page)));
  await H.press(page, "Enter", "undo", log, 700);
  log("after undo", await page.getByRole("button", { name: /^Remove/ }).count());
  await rm.nth(0).focus(); await page.keyboard.press("Enter"); await H.sleep(500); await H.live(page);
  await H.press(page, "Control+z", "ctrl+z", log, 600);
  log("after ctrl+z", await page.getByRole("button", { name: /^Remove/ }).count());
  await H.axe(page, "guide-editor", log);
} finally { await browser.close(); }
