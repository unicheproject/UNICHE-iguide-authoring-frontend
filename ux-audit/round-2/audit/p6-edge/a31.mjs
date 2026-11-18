import { open, go, P, shot, settle, alerts, focused, FILES, problem, AP } from "./lib.mjs";
const PP = `/projects/${P}`;
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `${PP}/media`); await settle(page, 2000);
await page.getByRole("button", { name: /upload/i }).first().click(); await page.waitForTimeout(800);
const d = page.locator("[role=dialog]").first();
const input = d.locator("input[type=file]");
const rows = async () => (await d.innerText()).replace(/\n+/g, " | ").split("one with a")[0].split("Activity")[0].replace(/^.*?before you confirm them\. \|/, "").slice(0, 900);
const fb = async () => (await d.innerText()).split("\n").slice(-3).join(" | ");
// A: forced 500 on upload then retry
let posts = 0;
await page.route(AP, (r) => { if (r.request().method() === "POST" && /\/assets$/.test(r.request().url())) { posts++; return r.fulfill(problem(500, "INTERNAL_ERROR")); } return r.continue(); });
await input.setInputFiles(FILES + "UX-R2-p6-ok.png"); await page.waitForTimeout(2000);
console.log("A forced 500:", await rows(), "| posts", posts); console.log("ALERTS", JSON.stringify(await alerts(page)).slice(-300));
await shot(page, "upload__forced-500");
// retry still failing
await d.getByRole("button", { name: /retry/i }).first().click(); await page.waitForTimeout(1500);
console.log("A retry fail: rows ", (await d.getByRole("listitem").count()), "|", await rows());
// 503 then 422
await page.unroute(AP);
await page.route(AP, (r) => { if (r.request().method() === "POST" && /\/assets$/.test(r.request().url())) return r.fulfill(problem(503, "SERVICE_UNAVAILABLE")); return r.continue(); });
await d.getByRole("button", { name: /retry/i }).first().click(); await page.waitForTimeout(1500);
console.log("A 503:", await rows());
await shot(page, "upload__forced-503");
await page.unroute(AP);
// retry succeed
await d.getByRole("button", { name: /retry/i }).first().click(); await page.waitForTimeout(4000);
console.log("A retry ok:", await rows()); console.log("footer", await fb());
await shot(page, "upload__retry-success");
// B: duplicate of same file
await input.setInputFiles(FILES + "UX-R2-p6-ok.png"); await page.waitForTimeout(2000);
console.log("B duplicate:", await rows());
await shot(page, "upload__duplicate");
await browser.close();
