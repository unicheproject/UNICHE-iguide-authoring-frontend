import { open, go, P, shot, settle, alerts, focused, FILES, problem, AP } from "./lib.mjs";
const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `${PP}/media`); await settle(page, 2000);
await page.getByRole("button", { name: /upload/i }).first().click(); await page.waitForTimeout(800);
const d = page.locator("[role=dialog]").first();
const input = d.locator("input[type=file]");
const dump = async (label) => { console.log(`\n--- ${label}\nTEXT:`, (await d.innerText()).replace(/\n+/g, " | ").replace(/.*Done/, "").slice(0, 100)); console.log((await d.innerText()).replace(/\n+/g, " | ").split("| Any upload")[1]?.replace(/^.*?Other file types are held back until you confirm them\. \|/, "").slice(0, 900)); console.log("ALERTS", JSON.stringify(await alerts(page)).slice(0, 700), "| focus", await focused(page)); };
// 1 too big
await input.setInputFiles(FILES + "UX-R2-p6-toobig.png"); await page.waitForTimeout(1500); await dump("too big"); await shot(page, "upload__too-big");
// 2 exe + txt
await input.setInputFiles([FILES + "UX-R2-p6-notes.exe", FILES + "UX-R2-p6-readme.txt"]); await page.waitForTimeout(1500); await dump("exe + txt"); await shot(page, "upload__wrong-type");
// 3 empty
await input.setInputFiles(FILES + "UX-R2-p6-empty.png"); await page.waitForTimeout(1500); await dump("empty file"); await shot(page, "upload__empty-file");
await browser.close();
