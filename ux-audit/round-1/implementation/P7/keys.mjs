import { readFileSync } from "node:fs";
import { open, go } from "../../../tools/session.mjs";
const seed = JSON.parse(readFileSync(new URL("../../../tools/seed.json", import.meta.url), "utf8"));
const P = seed.projects.populated.id;
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/cb763579-1082-45a7-8038-ed6a91ecc3d4`); await page.waitForTimeout(2500);
await page.evaluate(() => document.querySelectorAll("vite-error-overlay").forEach((e) => e.remove()));
const add = page.getByRole("button", { name: /^Add image/ }).first();
await add.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(800);
const act = () => page.evaluate(() => { const a = document.activeElement; return a?.id || a?.getAttribute("aria-label") || a?.textContent?.trim().slice(0, 40); });
console.log("1 initial focus:", await act());
await page.keyboard.type("klepsydra"); await page.waitForTimeout(500);
console.log("tiles after search:", await page.locator("[aria-pressed]").count());
for (let i = 0; i < 9; i++) { await page.keyboard.press("Tab"); const a = await act(); if (/klepsydra/i.test(a ?? "")) { console.log("tile focused:", a); break; } }
await page.keyboard.press("Space"); await page.waitForTimeout(300);
console.log("status:", await page.getByRole("status").last().innerText());
await page.keyboard.press("Escape"); await page.waitForTimeout(500);
console.log("after Esc, focus:", await act(), "dialogs:", await page.getByRole("dialog").count());
await browser.close();
