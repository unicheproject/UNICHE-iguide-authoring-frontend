// P5b screenshots, keyboard run and axe. Windows Node: node ux-audit\round-1\implementation\P5b\shots.mjs [viewport...]
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { open, go } from "../../../tools/session.mjs";
const require = createRequire(new URL("../../../../package.json", import.meta.url));
const { AxeBuilder } = require("@axe-core/playwright");
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const rec = JSON.parse(readFileSync(new URL("./records.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const id = (list, key) => seed[list].find((x) => x.key === key).id;
const out = new URL("./after/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const vps = process.argv.slice(2).length ? process.argv.slice(2) : ["1440", "1024", "768", "zoom200"];
const result = {};
const ready = async (page) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator("main h1").first().waitFor({ state: "visible", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
};
const clean = (page) => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("iguide:draft:")).forEach((k) => localStorage.removeItem(k)));
const ev = `/projects/${P}/events/${rec.event}`;
const cat = `/projects/${P}/categories/${rec.category}`;

for (const vp of vps) {
  const { browser, page } = await open("curator", { viewport: vp });
  const shot = (n, full = true) => page.screenshot({ path: `${out}${n}__${vp}.png`, fullPage: full });
  const axe = async (name) => {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    result[`${vp}:axe:${name}`] = r.violations.map((v) => `${v.id} x${v.nodes.length} (${v.impact}) ${v.nodes[0]?.target}`);
  };
  const scrollTo = (sel) => page.locator(sel).first().scrollIntoViewIfNeeded();
  // Event
  await go(page, ev); await ready(page);
  await shot("event-draft"); await axe("event");
  await scrollTo("#dates"); await page.waitForTimeout(300); await shot("event-dates-view", false);
  // end before start inline, cleared on correction
  await page.locator("input[id^=occ-end-o-]:not([id*=time])").first().fill("2027-01-11");
  await page.waitForTimeout(400); await scrollTo("#dates"); await shot("event-end-before-start", false);
  result[`${vp}:endErrorShown`] = await page.getByText("It must end after it starts.").count();
  await page.locator("input[id^=occ-end-o-]:not([id*=time])").first().fill("2027-01-12");
  await page.waitForTimeout(300);
  result[`${vp}:endErrorAfterFix`] = await page.getByText("It must end after it starts.").count();
  // remove, undo
  await page.getByRole("button", { name: /^Remove date 2$/ }).click(); await page.waitForTimeout(400);
  result[`${vp}:removedBar`] = await page.getByRole("group", { name: "Removed date" }).count();
  result[`${vp}:focusAfterRemove`] = await page.evaluate(() => document.activeElement?.id);
  await shot("event-removed-undo", false);
  await page.getByRole("button", { name: /^Undo/ }).click(); await page.waitForTimeout(300);
  result[`${vp}:dateCardsAfterUndo`] = await page.locator("ol[aria-label='Dates of the event'] > li").count();
  // overflow check: remove and cancelled inside viewport width
  result[`${vp}:cardClipped`] = await page.evaluate(() => [...document.querySelectorAll("ol[aria-label='Dates of the event'] li button, ol[aria-label='Dates of the event'] input[role=switch]")].filter((e) => { const r = e.getBoundingClientRect(); return r.right > window.innerWidth + 1 || r.left < -1; }).length);
  result[`${vp}:docHScroll`] = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  // repeat weekly
  await page.getByRole("button", { name: /^Repeat weekly/ }).click(); await page.waitForTimeout(300);
  await scrollTo("#occ-repeat"); await shot("event-repeat-weekly", false);
  result[`${vp}:repeatPreview`] = await page.locator("#occ-repeat [role=status]").innerText();
  await page.getByRole("button", { name: /^Cancel$/ }).first().click().catch(() => {});
  // combobox
  await scrollTo("#f-poiId");
  const poi = page.locator("#f-poiId");
  await poi.click(); await poi.fill("a"); await page.waitForTimeout(400); await shot("event-poi-combobox", false);
  result[`${vp}:comboOptions`] = await page.locator("#f-poiId + svg + ul [role=option]").count();
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("Enter"); await page.waitForTimeout(300);
  result[`${vp}:comboValue`] = await poi.inputValue();
  // Greek tab: dates hidden
  const tab = page.getByRole("tab", { name: /ελληνικά/i });
  if (await tab.count()) { await tab.click(); await page.waitForTimeout(600); await scrollTo("#dates"); await shot("event-greek-tab", false); result[`${vp}:greekCards`] = await page.locator("ol[aria-label='Dates of the event']").count(); }
  await clean(page);
  // Category
  await go(page, cat); await ready(page);
  await shot("category-draft"); await axe("category");
  const radios = await page.locator("input[name^=v-][type=radio], fieldset#f-icon input[type=radio]").evaluateAll((els) => els.filter((e) => e.closest("#f-icon")).map((e) => e.tabIndex));
  result[`${vp}:iconTabStops`] = radios.filter((t) => t >= 0).length + " of " + radios.length + " tabindex>=0 (native radios: group is one Tab stop)";
  await page.locator("#f-icon input:checked").focus(); { let n = 0; await page.keyboard.press("Tab"); while (await page.evaluate(() => !!document.activeElement?.closest("#f-icon")) && n++ < 30) await page.keyboard.press("Tab"); result[`${vp}:tabsToLeaveIconGroup`] = n; await page.locator("#f-icon input:checked").focus(); }
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  result[`${vp}:iconAfterArrows`] = await page.locator("#f-icon input:checked").evaluate((e) => e.value);
  await scrollTo("#f-icon"); await shot("category-icon-selected", false);
  await clean(page);
  // used, active category
  await go(page, `/projects/${P}/categories/${id("categories", "monuments")}`); await ready(page);
  await shot("category-active-used"); await axe("category-used");
  await clean(page);
  await browser.close();
}
writeFileSync(new URL("./results.json", import.meta.url), JSON.stringify(result, null, 1));
console.log(JSON.stringify(result, null, 1));
