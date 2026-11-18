import { open, go, P, shot, settle, alerts, focused, FILES, problem, AP } from "./lib.mjs";
const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `${PP}/media`); await settle(page, 2000);
await page.getByRole("button", { name: /upload/i }).first().click(); await page.waitForTimeout(800);
const d = () => page.locator("[role=dialog]").last();
await d().locator("input[type=file]").setInputFiles([FILES + "UX-R2-p6-fresh-1.png", FILES + "UX-R2-p6-fresh-2.png"]); await page.waitForTimeout(3500);
const txt = async () => (await d().innerText()).replace(/\n+/g, " | ");
console.log("after upload:", (await txt()).slice(-200));
await shot(page, "upload__duplicates-held-2");
for (let i=0;i<2;i++) { await d().getByRole("button", { name: /Upload anyway/ }).first().click({timeout:4000}).catch(e=>console.log("click fail", e.message.slice(0,400))); await page.waitForTimeout(3000); }
console.log("state:", (await txt()).slice(-250));
await page.waitForTimeout(2000);
await d().getByRole("button", { name: /Describe now/ }).click(); await page.waitForTimeout(1500);
console.log("DESCRIBE:", (await txt()).slice(0, 900)); console.log("focus", await focused(page));
await shot(page, "describe-now__step1");
// save empty alt?
console.log("buttons", await d().getByRole("button").allInnerTexts());
const alt = d().locator("textarea,input[type=text]").first();
// try Next/Save without text
const next = d().getByRole("button", { name: /save|next|skip|done/i });
console.log("next btns", await next.allInnerTexts());
// forced 500 on save
await page.route(AP, (r) => r.request().method() === "PUT" ? r.fulfill(problem(500, "INTERNAL_ERROR")) : r.continue());
await alt.fill("ALT-REJECTED-TEXT a test image");
await d().getByRole("button", { name: /^(save|next|save and next)/i }).first().click(); await page.waitForTimeout(1500);
console.log("after forced 500:", (await txt()).slice(0, 700), "| alerts", JSON.stringify(await alerts(page)).slice(-300), "| focus", await focused(page));
await shot(page, "describe-now__save-500");
await page.unroute(AP);
await d().getByRole("button", { name: /^(save|next|save and next|try again|retry)/i }).first().click(); await page.waitForTimeout(2000);
console.log("after retry:", (await txt()).slice(0, 600));
await shot(page, "describe-now__step2");
await browser.close();
