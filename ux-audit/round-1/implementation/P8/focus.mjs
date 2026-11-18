import { open, go } from "../../../tools/session.mjs";
import { readFileSync } from "node:fs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${seed.projects.populated.id}/preview`);
await page.waitForTimeout(6000); console.log(await page.url(), (await page.locator("main").innerText()).slice(0,300)); await page.waitForSelector("[data-preview-frame]", { state: "attached", timeout: 30000 });
await page.getByRole("button", { name: "Interact with the preview" }).click();
await page.getByRole("tab", { name: "Mobile" }).click();
await page.waitForTimeout(500);
await page.locator("[data-preview-frame] button").first().focus();
console.log("in frame:", await page.evaluate(() => !!document.activeElement.closest("[data-preview-frame]")));
const seen = [];
for (let i = 0; i < 80; i++) { await page.keyboard.press("Tab"); const r = await page.evaluate(() => { const e = document.activeElement; return { inFrame: !!e.closest("[data-preview-frame]"), name: (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 30), chrome: !!e.closest("header, nav, aside") }; }); seen.push(r); if (!r.inFrame && r.chrome) break; }
console.log("tabbed", seen.length, "last", seen.at(-1));
await page.getByRole("link", { name: "Places" }).first().click();
await page.waitForURL(/places/); console.log("nav link usable ->", page.url());
await browser.close();
