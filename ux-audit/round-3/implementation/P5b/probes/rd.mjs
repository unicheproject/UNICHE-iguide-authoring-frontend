import { session, go, P, ids, LOG, sleep } from "./h.mjs";
const log = LOG("rd");
const { browser, page } = await session({ viewport: "1440" });
await go(page, P(`/events/${ids.eventEmpty}`));
await page.waitForSelector("#readiness-heading", { timeout: 20000 }); await sleep(800);
log(await page.locator("li", { hasText: "Warning:" }).first().ariaSnapshot());
log(await page.evaluate(() => [...document.querySelectorAll("li")].filter((l) => /Warning:/.test(l.textContent)).map((l) => l.innerText + " | " + l.textContent.replace(/\s+/g, "_"))));
await browser.close();
