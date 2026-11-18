import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/media/abd27d8b-918b-4c20-aa62-0bffba4e9ee0"), 2500);
await L.watchLive(page);
L.log("t42", "asset title", await page.title(), "axe", await L.axe(page, "asset-editor-mine"));
await L.shot(page, "asset-editor__mine__1440", true);
L.log("t42", "asset aria", (await L.snap(page, "asset-editor", "main")).split("\n").slice(0, 60).join("\n"));
await page.evaluate(() => document.querySelector("h1")?.focus());
L.log("t42", "tabs", (await L.tabs(page, 18)).map((x, i) => i + 1 + ": " + x));
// Alt text typing + Ctrl+S announcement
const alt = page.getByRole("textbox", { name: /alt/i }).first();
await alt.focus(); await k.type("Purple square used for the keyboard audit"); await k.press("Control+s"); await page.waitForTimeout(2500);
L.log("t42", "after save: focus", await L.focus(page), "live", (await L.liveLog(page)).slice(-3));
// New tab preview
await L.nav(page, `/projects/${L.POP}/app-preview?surface=WEB&lang=en`, 2500);
L.log("t42", "app-preview: title", await page.title(), "focus", await L.focus(page), "aria", (await L.snap(page, "app-preview", "body")).split("\n").slice(0, 25).join("\n"));
L.log("t42", "axe app-preview", await L.axe(page, "app-preview"));
await L.shot(page, "app-preview__bare__1440");
await browser.close();
