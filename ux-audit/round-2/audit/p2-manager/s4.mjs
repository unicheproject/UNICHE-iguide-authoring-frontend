import { fresh, uiSignIn, shot, text, CMS } from "./lib.mjs";
const acct = process.argv[2] ?? "admin";
const { browser, page } = await fresh("1440");
await uiSignIn(page, acct, "1440", () => {});
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5", B = "1d6971ce-6391-4da8-848e-8d7466d25128";
const ready = async () => { await page.waitForFunction(() => !document.querySelector("[aria-busy=true]") && /Nothing is live|block going live|Ready|Waiting|Content revision/.test(document.body.innerText), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(800); };
await page.goto(`${CMS}/projects/${B}`); await ready();
await page.waitForTimeout(3000);
console.log("switcher text after 4s:", JSON.stringify(await text(page, "header")));
// expand warnings
await page.getByRole("button", { name: /Project\s*1|Project/ }).filter({hasText:"Project"}).first().click().catch(e=>console.log("no warn group btn", e.message.slice(0,80)));
await page.waitForTimeout(500);
await shot(page, `dashboard__emptyB-warning-expanded-${acct}`, "1440", false);
console.log("WARN:\n" + (await text(page, "main")).split("Warnings")[1]?.slice(0,500));
// Project details
await page.getByText("Project details").first().click(); await page.waitForTimeout(400);
await shot(page, `dashboard__emptyB-details-${acct}`, "1440", true);
console.log("DETAILS:\n" + (await text(page, "main")).split("Project details")[1]?.slice(0,600));
// hover chip Active
await page.locator("h1 + *, main h1 ~ span").first().hover().catch(()=>{});
console.log("title attrs:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("[title]")].map(e=>e.getAttribute("title")).slice(0,15))));
console.log("hint buttons on page:", await page.locator("[aria-label^='What is']").count());
// Activate content
await page.getByRole("link", { name: "Activate content" }).or(page.getByRole("button", { name: "Activate content" })).first().click();
await page.waitForTimeout(2500);
console.log("Activate content ->", page.url(), await page.title());
await shot(page, `dashboard__emptyB-activate-target-${acct}`, "1440", false);
// Populated review warnings
await page.goto(`${CMS}/projects/${P}`); await ready();
await page.getByRole("link", { name: "Review warnings" }).or(page.getByRole("button", { name: "Review warnings" })).first().click();
await page.waitForTimeout(1200);
console.log("Review warnings ->", page.url(), "focus:", await page.evaluate(()=>document.activeElement?.tagName+" "+(document.activeElement?.textContent||"").slice(0,40)));
await shot(page, `dashboard__populated-review-warnings-${acct}`, "1440", false);
const w = page.getByRole("button", { name: /Point of interest/ }).first();
await w.click().catch(()=>{}); await page.waitForTimeout(600);
await shot(page, `dashboard__populated-warning-group-open-${acct}`, "1440", false);
console.log("OPEN GROUP:\n" + (await text(page, "main")).split("Warnings (")[1]?.slice(0,1500));
await browser.close();
