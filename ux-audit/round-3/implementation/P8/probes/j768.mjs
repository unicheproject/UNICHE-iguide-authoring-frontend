import { session, go, P, sleep } from "./h.mjs";
import { join } from "node:path"; import { fileURLToPath } from "node:url";
const OUT = join(fileURLToPath(new URL("../", import.meta.url)), "after");
const { browser, page } = await session({ viewport: "768" });
await go(page, P("/preview")); await page.waitForSelector("[data-preview-frame]"); await sleep(1000);
for (const s of ["Web","Mobile","Kiosk"]) { await page.getByRole("tab", { name: s, exact: true }).first().click(); await sleep(500); await page.screenshot({ path: join(OUT, `j768-${s}.png`) }); }
await browser.close();
