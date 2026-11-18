import * as H from "./h.mjs";
const log = H.LOG("f2");
const { browser, page } = await H.session();
try {
  await H.go(page, H.P("/events")); await page.getByRole("searchbox").fill("UX-R3-p5 Event"); await H.sleep(900);
  await page.getByRole("link", { name: "UX-R3-p5 Event" }).first().focus(); await page.keyboard.press("Enter"); await H.sleep(2200);
  await page.getByRole("button", { name: "Add a date" }).focus(); await H.press(page, "Enter", "add date", log, 700);
  await H.shot(page, "event-editor__date-row__1440");
  await H.snap(page, "event-dates", "section:has(h2:has-text('Dates'))");
  log("fields", await page.evaluate(() => [...document.querySelectorAll("section")].find(s => /^Dates/.test(s.querySelector("h2")?.textContent.trim() || "")).querySelectorAll("input,select,button,[role=group],fieldset")).length === undefined ? "" : "");
  const sec = await page.evaluate(() => [...[...document.querySelectorAll("section")].find(s => /^Dates/.test(s.querySelector("h2")?.textContent.trim() || "")).querySelectorAll("input,select,button,[role=group],fieldset")].map(e => e.tagName + ":" + (e.getAttribute("role")||"") + ":" + (e.getAttribute("aria-label") || e.labels?.[0]?.textContent?.trim() || e.textContent.trim()).slice(0, 50) + ":" + (e.getAttribute("inputmode")||"") + ":" + (e.getAttribute("placeholder")||"")));
  log("dates controls", sec);
  // type into the first date: focus the first input in the dates section
  const first = page.locator("section:has(h2:has-text('Dates')) input").first(); await first.focus();
  log("first", H.brief(await H.AE(page)));
  const typeIn = async (v, label) => { await page.keyboard.press("Control+a"); await page.keyboard.type(v, { delay: 30 }); await H.live(page); await page.keyboard.press("Tab"); await H.sleep(500); const l = await H.live(page); log(`typed ${label}=${v} -> focus ${H.brief(await H.AE(page))} | live=${JSON.stringify(l.map(x=>x.text))}`); };
  await typeIn("31", "day"); await page.keyboard.type("Feb"); log("month", await page.evaluate(() => document.activeElement.value)); await page.keyboard.press("Tab"); await H.sleep(300);
  await typeIn("2027", "year"); await typeIn("25", "hour"); await typeIn("61", "minute");
  log("invalid inputs", await page.evaluate(() => [...document.querySelectorAll("[aria-invalid=true]")].map(i => (i.getAttribute("aria-label") || i.id) + " -> " + (document.getElementById((i.getAttribute("aria-describedby")||"").split(" ")[0])?.textContent || ""))));
  log("fieldset legend/desc", await page.evaluate(() => [...document.querySelectorAll("section fieldset")].slice(0,2).map(f => f.querySelector("legend")?.textContent + " | " + document.getElementById(f.getAttribute("aria-describedby")||"x")?.textContent)));
  await H.shot(page, "event-editor__date-invalid__1440");
  await H.axe(page, "event-date-invalid", log);
  await H.press(page, "Control+s", "save invalid", log, 1500); log("live", JSON.stringify(await H.live(page)));
  await H.shot(page, "event-editor__date-save-invalid__1440");
  log("summary", await page.evaluate(() => document.querySelector("[data-error-summary]")?.innerText));
} finally { await browser.close(); }
