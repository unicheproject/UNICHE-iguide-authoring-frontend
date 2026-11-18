import * as H from "./h.mjs";
const log = H.LOG("j2");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/preview")); await H.sleep(1500);
  const skip = page.getByRole("link", { name: "Skip preview" }); await skip.focus(); await H.press(page, "Enter", "skip preview", log, 500);
  log("after skip", await page.evaluate(() => location.hash), H.brief(await H.AE(page)));
  const region = page.getByRole("region", { name: /^Preview:/ });
  log("frame inert before interact", await page.evaluate(() => { const r = document.querySelector("[role=region][aria-label^=Preview]"); const inner = r.querySelectorAll("button,a,input,[tabindex]"); return { inertAttr: !!r.querySelector("[inert]"), ariaHidden: !!r.querySelector("[aria-hidden=true]"), focusables: inner.length }; }));
  await page.getByRole("button", { name: "Interact with the preview" }).focus();
  await H.press(page, "Enter", "interact", log, 800);
  await H.shot(page, "preview__interacting__1440");
  log("interact state", await page.evaluate(() => ({ btns: [...document.querySelectorAll("button")].filter(b => /interact|stop/i.test(b.textContent + b.getAttribute("aria-label"))).map(b => b.textContent.trim() + "|" + b.getAttribute("aria-pressed")) })));
  log("tab into frame:"); for (let i = 0; i < 6; i++) { const a = (await H.tab(page, 1))[0]; log(i, H.brief(a), H.flag(await H.chk(page))); }
  await H.press(page, "Escape", "esc inside frame", log, 500);
  log("after esc", JSON.stringify(await H.live(page)));
  await H.press(page, "Escape", "esc 2", log, 500);
  // tab out of frame while interacting
  await page.getByRole("button", { name: /Interact/ }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(500);
  const total = []; for (let i = 0; i < 80; i++) { const a = (await H.tab(page, 1))[0]; total.push(a); if (a.body || /Interact|Stop interacting/.test(a.name)) { log("left frame after", i + 1, "stops ->", H.brief(a)); break; } }
  await H.axe(page, "preview-interacting", log);
} finally { await browser.close(); }
