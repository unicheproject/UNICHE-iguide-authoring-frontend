import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
const wait = async () => { await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(1500); };
const tabs = async () => (await page.locator("[role=tab]").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")))).join(" / ");
const fillAll = async (lang, vals) => { for (const [l, v] of Object.entries(vals)) await page.getByLabel(`${l} in ${lang}`, { exact: true }).fill(v); };
// Event
await go(page, `/projects/${PID}/events/${ids.event}`); await wait();
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(500);
await fillAll("Ελληνικά", { Title: "UX-R2-p3 Βραδινή Διάλεξη", Summary: "Διάλεξη για την αρχαία αγορά της πόλης.", Description: "Οι πόρτες ανοίγουν στις 18:30. Οι θέσεις είναι περιορισμένες.", "Location text": "Κεντρική αίθουσα, δεύτερος όροφος." });
console.log("event el:", await tabs());
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
await page.getByRole("tab", { name: /Italiano/ }).click(); await page.waitForTimeout(500);
await fillAll("Italiano", { Title: "UX-R2-p3 Conferenza serale", Summary: "Una conferenza sul mercato antico." });
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
console.log("event it:", await tabs());
await shot(page, "event-editor__it-partial");
// Category
await go(page, `/projects/${PID}/categories/${ids.cat}`); await wait();
await shot(page, "category-editor__en-tab");
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(500);
await shot(page, "category-editor__el-tab");
console.log("cat labels:", await page.locator("label").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")).filter(t=>/Ελληνικά/.test(t)).join(" ; ")));
console.log("cat ctrls in panel:", await page.locator("main button").evaluateAll(e => e.map(b => (b.getAttribute("aria-label")||b.innerText).trim().replace(/\n/g," ").slice(0,30)).filter(Boolean).join(" ; ")));
await fillAll("Ελληνικά", { Name: "UX-R2-p3 Ζωή της Αγοράς", Description: "Καταστήματα, στοές και καθημερινό εμπόριο στην αρχαία πόλη." }).catch(e => console.log("cat fill", e.message.slice(0,120)));
console.log("cat el:", await tabs());
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
console.log("cat saved:", await tabs());
await browser.close();
