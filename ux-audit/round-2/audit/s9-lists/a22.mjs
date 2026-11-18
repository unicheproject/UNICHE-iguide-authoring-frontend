import { open, go, shot, POP } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${POP}/places?q=${encodeURIComponent("UX-R2-s9 temp")}`); await page.waitForTimeout(1200);
console.log(await page.locator("tbody tr").evaluateAll((r) => r.map((x) => x.innerText.replace(/\s+/g, " ").slice(0, 100) + " | indent=" + (x.querySelector("td:nth-child(2) > *")?.getBoundingClientRect().left))));
await page.locator("tbody tr a").nth(1).click(); await page.waitForTimeout(1500);
console.log("editor text:", (await page.locator("main").innerText()).replace(/\s+/g, " ").match(/(Inside|Parent|Level|Sub-place|inside)[^]{0,160}/)?.[0]);
await shot(page, "place-created-subplace-noparent__editor", "1440");
await browser.close();
