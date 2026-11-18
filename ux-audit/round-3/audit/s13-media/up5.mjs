import { open, go, P, shot, settle } from "./h.mjs";
const vp = process.argv[2] ?? "1440";
const { browser, page } = await open("admin", { viewport: vp });
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
await go(page, `/projects/${P}/media`); await settle(page);
await page.getByRole("button", { name: "Upload files" }).first().click(); await page.waitForTimeout(500);
await page.locator("input[type=file]").setInputFiles([{ name: "UX-R3-s13 one.png", mimeType: "image/png", buffer: png }, {name:"UX-R3-s13 tool2.exe", mimeType:"application/x-msdownload", buffer: Buffer.from("MZ2")}]);
await page.waitForTimeout(2500);
await shot(page, `upload__duplicate-name__${vp}`);
console.log("dup", await page.evaluate(() => document.querySelector("[role=dialog] ul[aria-label=Files]").innerText.replace(/\n+/g, " | ")));
console.log("buttons", await page.evaluate(() => [...document.querySelectorAll("[role=dialog] button")].map(b => b.textContent.trim() + "|" + b.getAttribute("aria-label"))));
// Skip all via keyboard check focus
await page.getByRole("button", { name: /^Skip/ }).first().click(); await page.waitForTimeout(300);
console.log("after skip", await page.evaluate(() => document.activeElement.tagName + " " + (document.activeElement.getAttribute("aria-label")||document.activeElement.textContent).trim().slice(0, 40)));
console.log(await page.evaluate(() => document.querySelector("[role=dialog] ul[aria-label=Files]").innerText.replace(/\n+/g, " | ")));
await shot(page, `upload__skipped__${vp}`);
await page.getByRole("button", { name: /^Skip/ }).first().click(); await page.waitForTimeout(300);
console.log("footer", await page.evaluate(() => document.querySelector("[role=dialog]").innerText.split("\n").slice(-4).join(" | ")));
await browser.close();
