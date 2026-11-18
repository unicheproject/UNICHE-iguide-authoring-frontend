import { open, go, P, ids, shot } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
const base = `/projects/${P}/media/${ids.one}`;
await go(page, base); await page.waitForTimeout(3500);
const st = () => page.evaluate(() => ({ cb: document.querySelector("input[type=checkbox]")?.checked, main: (document.querySelector("main")?.innerText.match(/No unsaved[^\n]*|Unsaved[^\n]*|unsaved[^\n]*/i) ?? [null])[0], tabs: [...document.querySelectorAll("[role=tab]")].map((t) => t.innerText.replace(/\n+/g, " ")), side: document.querySelector("#editor-side-column")?.innerText.replace(/\n+/g, " | ").slice(0, 700) }));
const box = page.getByLabel("Decorative image");
console.log("init", JSON.stringify(await st()));
if (vp === "1440") {
  await box.click(); await page.waitForTimeout(400);
  console.log("ticked, dialog open, checked:", await box.isChecked());
  await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  console.log("esc", JSON.stringify((({ cb, main }) => ({ cb, main }))(await st())), "focus", await page.evaluate(() => document.activeElement?.type + ":" + document.activeElement?.closest("label")?.innerText.slice(0, 20)));
  await box.click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Keep it described" }).click(); await page.waitForTimeout(500);
  console.log("keep", JSON.stringify((({ cb, main }) => ({ cb, main }))(await st())), "checked", await box.isChecked());
  await box.click(); await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Mark decorative" }).click(); await page.waitForTimeout(500);
  console.log("confirm", await box.isChecked(), JSON.stringify((await st()).main));
  await box.click(); await page.waitForTimeout(400);
  console.log("unticked", await box.isChecked());
  await page.locator("textarea").first().fill("");
}
await shot(page, `editor__default__${vp}`);
// Greek tab
await go(page, base + "?lang=el"); await page.waitForTimeout(3500);
const el = await page.evaluate(() => {
  const outside = [...document.querySelectorAll("main input, main textarea, main select")].filter((i) => !i.closest("#other-settings-body") && !i.closest("#editor-side-column") && i.type !== "file" && i.type !== "hidden");
  const folded = document.querySelector("#other-settings-body");
  return { activeTab: document.querySelector("[role=tab][aria-selected=true]")?.innerText, outside: outside.map((i) => `${i.tagName}:${i.type}:${i.id}:${i.closest("label")?.innerText.slice(0,20) ?? i.getAttribute("aria-label") ?? ""}:${i.offsetParent !== null}`), foldedHidden: folded && getComputedStyle(folded).display, decVisible: !!document.querySelector("#other-settings-body input[type=checkbox]")?.offsetParent, toggle: document.querySelector("[aria-controls=other-settings-body]")?.innerText.replace(/\n+/g, " ") };
});
console.log("el", JSON.stringify(el, null, 1));
await shot(page, `editor__greek__${vp}`);
await page.locator("[aria-controls=other-settings-body]").click(); await page.waitForTimeout(300);
await shot(page, `editor__greek-open__${vp}`);
await browser.close();
