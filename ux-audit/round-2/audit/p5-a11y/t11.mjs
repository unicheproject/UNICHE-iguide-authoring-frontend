import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
const POI = "35d91cba-d64a-43ce-9773-1e472226d028";
await L.nav(page, L.P("/pois/" + POI), 1500);
await L.watchLive(page);
const act = page.getByRole("button", { name: /^Activate/ }).first();
await act.focus(); await k.press("Enter"); await page.waitForTimeout(700);
L.log("t11", "confirm open: focus", await L.focus(page), "dialogs", await page.locator("[role=alertdialog],[role=dialog]").evaluateAll((d) => d.map((x) => x.getAttribute("role") + "|" + x.getAttribute("aria-label") + "|modal=" + x.getAttribute("aria-modal"))));
await L.shot(page, "poi-editor__activate-confirm__1440");
L.log("t11", "dialog aria", await L.snap(page, "activate-confirm", "[role=alertdialog],[role=dialog]"));
L.log("t11", "tabs in confirm", await L.tabs(page, 5));
L.log("t11", "bg inert?", await page.evaluate(() => { const m = document.querySelector("main"); return { ariaHidden: m?.closest("[aria-hidden]")?.getAttribute("aria-hidden"), inert: m?.closest("[inert]") != null }; }));
await k.press("Escape"); await page.waitForTimeout(400);
L.log("t11", "after Esc: focus", await L.focus(page), "dialogs", await page.locator("[role=alertdialog],[role=dialog]").count());
// More actions menu
await page.getByRole("button", { name: "More actions" }).focus(); await k.press("Enter"); await page.waitForTimeout(300);
L.log("t11", "more menu: focus", await L.focus(page), await L.snap(page, "more-menu", "[role=menu]"));
await k.press("Escape"); L.log("t11", "esc", await L.focus(page));
// warnings button
await page.getByRole("button", { name: /warnings in this/ }).focus(); await k.press("Enter"); await page.waitForTimeout(500);
L.log("t11", "warnings btn: focus", await L.focus(page), "popover?", await page.locator("[role=dialog],[data-state=open]").count());
await L.shot(page, "poi-editor__warnings-button__1440");
// Preview in app
await page.getByRole("button", { name: "Preview in app" }).focus(); await k.press("Enter"); await page.waitForTimeout(1500);
L.log("t11", "preview in app open: focus", await L.focus(page));
await L.shot(page, "poi-editor__preview-in-app__1440");
L.log("t11", "preview tabs", await L.tabs(page, 12));
L.log("t11", "preview aria", (await L.snap(page, "preview-in-app", "aside")).split("\n").slice(0, 70).join("\n"));
await k.press("Escape"); await page.waitForTimeout(500);
L.log("t11", "Esc: focus", await L.focus(page), "still open?", await page.getByRole("button", { name: /Close preview|Hide preview/i }).count());
await browser.close();
