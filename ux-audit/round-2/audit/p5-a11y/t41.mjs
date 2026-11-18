import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
const k = page.keyboard;
await L.nav(page, L.P("/guides/bcc7d2be-50ef-46cb-85e2-ced86c6559a3"), 2500);
await L.watchLive(page);
L.log("t41", "guide axe", await L.axe(page, "guide-editor-existing"));
const s = await L.snap(page, "guide-editor", "main");
L.log("t41", "level btns", s.split("\n").filter((l) => /Level|Heading|H2|H3|Move|Remove|Add/.test(l)).slice(0, 25).join("\n"));
await L.shot(page, "guide-editor__existing__1440", true);
// FLOOR PLAN
await L.nav(page, L.P("/floor-plans/d40864d1-684a-466f-819d-68fa651b7146"), 2500);
await L.watchLive(page);
L.log("t41", "floor plan title", await page.title(), "h", await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map((h) => h.tagName + " " + h.textContent.trim().slice(0, 40))));
const fs = await L.snap(page, "floorplan-editor", "main");
L.log("t41", "floor plan aria", fs.split("\n").slice(0, 70).join("\n"));
await L.shot(page, "floor-plan-editor__existing__1440", true);
await page.evaluate(() => document.querySelector("h1")?.focus());
L.log("t41", "fp tabs", (await L.tabs(page, 30)).map((x, i) => i + 1 + ": " + x));
await browser.close();
