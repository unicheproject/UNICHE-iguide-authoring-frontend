import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/categories/ca8a9d3c-85c8-4c3a-b522-2309120772ac"), 1500);
await L.watchLive(page);
const radios = page.getByRole("group", { name: "Icon" }).getByRole("radio");
await radios.first().focus(); L.log("t24", "first focus (None checked)", await L.focus(page));
await L.shot(page, "category-editor__icon-grid-focus__1440");
await k.press("ArrowRight"); L.log("t24", "ArrowRight", await L.focus(page));
await k.press("ArrowDown"); L.log("t24", "ArrowDown", await L.focus(page));
await k.press("End"); L.log("t24", "End", await L.focus(page));
await k.press("Home"); L.log("t24", "Home", await L.focus(page));
await k.press("ArrowRight"); await k.press("ArrowRight");
L.log("t24", "checked", await radios.evaluateAll((r) => r.filter((x) => x.checked).map((x) => x.getAttribute("aria-label") || x.value || x.parentElement.textContent.trim())));
await L.shot(page, "category-editor__icon-selected__1440");
L.log("t24", "Tab out", await L.tabs(page, 1), "Shift+Tab back to checked?", await L.tabs(page, 1, true));
L.log("t24", "live", (await L.liveLog(page)).slice(-2));
// selected visual: label styles
L.log("t24", "labels", await page.getByRole("group", { name: "Icon" }).locator("label").evaluateAll((ls) => ls.slice(0,4).map((l) => { const c = getComputedStyle(l); return { t: l.textContent.trim(), bg: c.backgroundColor, bc: c.borderColor, bw: c.borderWidth }; })));
// ring when radio focused: look at the focus ring visibility
const f = await page.evaluate(() => { const e = document.activeElement; const l = e.closest("label"); const c = getComputedStyle(l ?? e); return { el: e.tagName, labelOutline: c.outline, labelShadow: c.boxShadow, radioOutline: getComputedStyle(e).outline, radioOpacity: getComputedStyle(e).opacity, radioSize: e.getBoundingClientRect().width }; });
L.log("t24", "focus style", f);
await browser.close();
