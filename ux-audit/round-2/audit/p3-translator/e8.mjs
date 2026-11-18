import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
const wait = async () => { await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(1500); };
const tabs = async () => (await page.locator("[role=tab]").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")))).join(" / ");
const fields = async (code) => page.locator(`#panel-${code} input:not([type=checkbox]), #panel-${code} textarea`).evaluateAll(e => e.map(x => `${x.id}|${x.labels?.[0]?.innerText.replace(/\n/g," ")}|dir=${x.dir}|lang=${x.lang}`));
await go(page, `/projects/${PID}/guides/${ids.guide}`); await wait();
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(600);
console.log((await fields("el")).join("\n"));
const GR = ["Η Αγορά ήταν το μέρος όπου οι Αθηναίοι συναντιόντουσαν για να εμπορεύονται.", "Ξεκινήστε από την Παναθηναϊκή Οδό, τον δρόμο που διέσχιζε διαγώνια την πλατεία.", "Τελειώστε στη Στοά του Αττάλου, όπου σήμερα στεγάζεται το μουσείο."];
await page.getByLabel("Title in Ελληνικά").fill("UX-R2-p3 Περπατώντας στην Αγορά");
const all = page.locator("#panel-el textarea, #panel-el input").filter({ hasNot: page.locator("x") });
const fs2 = await page.locator("#panel-el textarea").evaluateAll(e => e.map(x => x.id));
console.log("textareas", fs2.length);
let i = 0;
for (const id of fs2) { if (i === 0) await page.locator(`#${CSS_ESC(id)}`).locator("xpath=ancestor::*[.//button[contains(.,'Copy source')]][1]").getByRole("button", { name: /Copy source/ }).first().click(); else await page.locator(`[id="${id}"]`).fill(GR[i % 3]); i++; }
console.log("tabs:", await tabs());
await shot(page, "guide-editor__el-filled");
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
console.log("saved:", await tabs());
await browser.close();
function CSS_ESC(s){ return s.replace(/([^\w-])/g, "\\$1"); }
