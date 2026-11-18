import { open, go, PID, shot, fs, listReady } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${PID}/events?q=${encodeURIComponent("Lecture")}`); await listReady(page); await page.waitForTimeout(800);
console.log((await page.locator("main").innerText()).replace(/\n+/g," | ").slice(400, 1100));
await shot(page, "events-list__r2-p3-lecture");
await go(page, `/projects/${PID}/events/${ids.event}`);
await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(2000);
const dates = page.getByText("Dates", { exact: true }).first(); await dates.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
await shot(page, "event-editor__dates-en", "1440", false);
console.log("date input value/format:", await page.locator("input[type=date]").first().evaluate(e => e.value + " / " + new Date(e.value + "T00:00").toLocaleDateString()), await page.evaluate(() => navigator.language));
console.log("fieldset help:", (await page.locator("main").innerText()).match(/This Project has no time zone[^\n]*/)?.[0]);
// Greek tab dates
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(500);
await page.getByText("Dates in", { exact: false }).first().scrollIntoViewIfNeeded().catch(()=>{}); 
await page.locator("text=Date 1:").first().scrollIntoViewIfNeeded(); await shot(page, "event-editor__dates-el", "1440", false);
await browser.close();
