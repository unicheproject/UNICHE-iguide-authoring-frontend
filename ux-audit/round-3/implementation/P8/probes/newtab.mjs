import { session, go, P, LOG, sleep, AE } from "./h.mjs";
import { join } from "node:path"; import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../../../package.json", import.meta.url));
const AxeBuilder = require("@axe-core/playwright").default;
const OUT = join(fileURLToPath(new URL("../", import.meta.url)), "after");
const log = LOG("newtab");
const { browser, page } = await session({ viewport: "1440" });
const read = () => page.evaluate(() => ({ scale: document.querySelector("[data-preview-frame]")?.getAttribute("data-scale"), w: Math.round(document.querySelector("[data-preview-frame] > div")?.getBoundingClientRect().width ?? 0), htmlLang: document.documentElement.lang, text: document.querySelector("header")?.innerText.replace(/\s+/g," ").slice(-90), title: document.title }));
await go(page, P("/app-preview?surface=kiosk&orientation=landscape")); await page.waitForSelector("[data-preview-frame]"); await sleep(800);
log("kiosk landscape", await read());
await go(page, P("/app-preview?surface=web&real=1")); await page.waitForSelector("[data-preview-frame]"); await sleep(800);
log("web real=1", await read());
await go(page, P("/app-preview?surface=web")); await page.waitForSelector("[data-preview-frame]"); await sleep(800);
log("web fit", await read());
await go(page, P("/app-preview?surface=%3Cscript%3E&lang=%3Cscript%3Ealert(1)%3C%2Fscript%3E&mode=zz&t=%3Cb%3E")); await page.waitForSelector("[data-preview-frame]"); await sleep(800);
const body = await page.content(); log("echo check: <script> in body text?", /&lt;script|<script>alert/.test(body), (await page.locator("[role=status]").allInnerTexts()));
await page.screenshot({ path: join(OUT, "newtab-invalid-1440.png") });
await go(page, P("/app-preview?lang=el&surface=mobile")); await page.waitForSelector("[data-preview-frame]"); await sleep(800); log("lang=el", await read());
log("axe", (await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze()).violations.map(v=>v.id+":"+v.impact));
// preview page lang param
await go(page, P("/preview?lang=%3Cscript%3E")); await sleep(1000); log("preview lang=<script> script text:", /<script>/.test(await page.locator("main").innerText()));
// from preview page: open in new tab honours options
await go(page, P("/preview")); await page.waitForSelector("[data-preview-frame]"); await sleep(800);
await page.getByRole("tab",{name:"Kiosk",exact:true}).first().click(); await page.getByRole("tab",{name:"Landscape"}).click(); await page.getByRole("tab",{name:/^100/}).click().catch(()=>{}); await sleep(300);
const [tab] = await Promise.all([page.context().waitForEvent("page"), page.getByRole("button",{name:"Open in new tab"}).click()]);
await tab.waitForLoadState("networkidle").catch(()=>{}); await tab.waitForSelector("[data-preview-frame]", {timeout:30000}); await sleep(1500); log("tab url", tab.url().split("?")[1]);
log("tab state", await tab.evaluate(() => ({ scale: document.querySelector("[data-preview-frame]")?.dataset.scale, w: Math.round(document.querySelector("[data-preview-frame] > div").getBoundingClientRect().width) })));
await tab.screenshot({ path: join(OUT, "newtab-from-preview-1440.png") });
// empty states
await page.route("**/projects/*/places*", (r) => r.fulfill({ json: { content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 } }));
await browser.close();
