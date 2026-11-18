import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${PID}/routes/${ids.route}`);
await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(1500);
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(600);
const info = await page.evaluate(() => [...document.querySelectorAll("main textarea, main input[type=text], main input:not([type])")].map(f => `${f.tagName}#${f.id}|path=${f.getAttribute("data-path")}|lbl=${f.labels?.[0]?.innerText.replace(/\n/g," ")}|val=${f.value.slice(0,25)}`));
console.log(info.join("\n"));
await browser.close();
