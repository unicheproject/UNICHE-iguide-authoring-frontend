import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/pois"));
await L.watchLive(page);
// Segments
await page.getByRole("radio", { name: /^Not archived/ }).focus();
await k.press("ArrowRight"); await page.waitForTimeout(500);
L.log("t4", "segment ArrowRight ->", await L.focus(page), "url", page.url().split("?")[1], "live", await L.liveLog(page));
await k.press("ArrowRight"); await page.waitForTimeout(500);
L.log("t4", "ArrowRight2", await L.focus(page), page.url().split("?")[1]);
await L.shot(page, "poi-list__segment-draft__1440");
L.log("t4", "tabs in segment group: next Tab", await L.tabs(page, 1));
await k.press("Shift+Tab"); 
await page.getByRole("radio", { name: /^Not archived/ }).focus(); await k.press("Space"); await page.waitForTimeout(400);
// Toggles
await page.getByRole("checkbox", { name: "Pending changes" }).focus(); await k.press("Space"); await page.waitForTimeout(600);
L.log("t4", "pending toggle: url", page.url().split("?")[1], "focus", await L.focus(page), "live", await L.liveLog(page));
await k.press("Space"); await page.waitForTimeout(400);
// search announce
await page.getByRole("searchbox", { name: "Search" }).focus(); await k.type("Frieze"); await page.waitForTimeout(900);
L.log("t4", "search live:", await L.liveLog(page));
await L.shot(page, "poi-list__search-frieze__1440");
await page.getByRole("searchbox", { name: "Search" }).fill(""); await page.waitForTimeout(600);
L.log("t4", "cleared; live tail", (await L.liveLog(page)).slice(-3));
// sort by keyboard
const sort = page.getByRole("combobox", { name: "Sort by" });
await sort.focus(); await k.press("ArrowDown"); await page.waitForTimeout(600);
L.log("t4", "sort ArrowDown:", await sort.inputValue(), page.url().split("?")[1], "live", (await L.liveLog(page)).slice(-2), "focus", await L.focus(page));
await sort.selectOption("manual").catch(() => {}); 
await page.getByRole("combobox", { name: "Sort by" }).selectOption({ index: 0 }); await page.waitForTimeout(500);
// sortable column header
await page.getByRole("button", { name: "Title" }).first().focus(); await k.press("Enter"); await page.waitForTimeout(500);
L.log("t4", "column sort btn:", await page.getByRole("columnheader", { name: /Title/ }).getAttribute("aria-sort"), "live", (await L.liveLog(page)).slice(-2), await L.focus(page));
await page.getByRole("combobox", { name: "Sort by" }).selectOption({ index: 0 });
// Row menu
const menuBtn = page.getByRole("button", { name: /^Actions for Parthenon Frieze/ });
await menuBtn.focus();
L.log("t4", "menu btn attrs", await menuBtn.evaluate((e) => [...e.attributes].map((a) => a.name + "=" + a.value.slice(0, 40)).join(" ")));
await k.press("Enter"); await page.waitForTimeout(400);
L.log("t4", "menu open focus", await L.focus(page));
L.log("t4", "menu aria", await L.snap(page, "row-menu", "[role=menu]"));
await L.shot(page, "poi-list__row-menu-open__1440");
const seq = [];
for (let i = 0; i < 9; i++) { await k.press("ArrowDown"); seq.push(await L.focus(page)); }
L.log("t4", "menu ArrowDown x9", seq);
await k.press("ArrowUp"); L.log("t4", "ArrowUp", await L.focus(page));
await k.press("Home"); L.log("t4", "Home", await L.focus(page));
await k.press("End"); L.log("t4", "End", await L.focus(page));
await k.press("Escape"); await page.waitForTimeout(300);
L.log("t4", "Esc -> focus", await L.focus(page));
// Open again; type-ahead; Tab closes?
await k.press("Enter"); await page.waitForTimeout(300); await k.press("Tab"); await page.waitForTimeout(300);
L.log("t4", "Tab from menu ->", await L.focus(page), "menu still open:", await page.locator("[role=menu]").count());
await browser.close();
