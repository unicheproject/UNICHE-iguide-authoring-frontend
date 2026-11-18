import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
const POI = "35d91cba-d64a-43ce-9773-1e472226d028";
await L.nav(page, L.P("/pois/" + POI), 1500);
await L.watchLive(page);
L.log("t8", "title", await page.title(), "focus", await L.focus(page));
await L.shot(page, "poi-editor__fresh-draft__1440", true);
const s = await L.snap(page, "poi-editor-draft", "body");
L.log("t8", "landmarks", await page.evaluate(() => [...document.querySelectorAll("header,nav,main,aside,footer,[role=banner],[role=navigation],[role=main],[role=complementary],[role=region],section[aria-label],section[aria-labelledby]")].map((e) => e.tagName + (e.getAttribute("aria-label") ? ":" + e.getAttribute("aria-label") : ""))));
L.log("t8", "headings", await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4")].map((h) => h.tagName + " " + h.textContent.trim().slice(0, 50))));
L.log("t8", "axe", await L.axe(page, "poi-editor-draft"));
// tab sequence through the page from top of main
await page.evaluate(() => { document.querySelector("h1")?.focus(); });
const t = await L.tabs(page, 70);
L.log("t8", "tab sequence (70):", t.map((x, i) => i + 1 + ": " + x));
await browser.close();
