import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
const wait = async () => { await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(1500); };
const tabs = async () => (await page.locator("[role=tab]").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")))).join(" / ");
const GR = ["Μια ήρεμη βόλτα ανάμεσα σε τρεις στάσεις.", "Φορέστε άνετα παπούτσια.", "Ξεκινήστε από την πύλη.", "Συνεχίστε στο σηματοδοτημένο μονοπάτι.", "Η Αγορά ήταν το μέρος όπου οι Αθηναίοι συναντιόντουσαν για να εμπορεύονται, να ψηφίζουν και να διαφωνούν.", "Ξεκινήστε από την Παναθηναϊκή Οδό, τον δρόμο που διέσχιζε διαγώνια την πλατεία."];
let gi = 0;
async function fillPanel(code, label) {
  const sel = `#panel-${code} input[data-path], #panel-${code} textarea[data-path]`;
  const n = await page.locator(sel).count();
  let filled = 0, copied = 0;
  for (let i = 0; i < n; i++) {
    const f = page.locator(sel).nth(i);
    if (!(await f.isVisible())) continue;
    if ((await f.inputValue()).trim()) continue;
    const path = await f.getAttribute("data-path");
    // copy source button within same field group when the source exists, else type
    const group = f.locator("xpath=ancestor::*[.//button[contains(.,'Copy source')]][1]");
    const cs = group.getByRole("button", { name: /Copy source/ });
    const disabled = await cs.first().isDisabled().catch(() => true);
    if (!disabled && copied < 1) { await cs.first().click(); copied++; }
    else if (!disabled) { await f.fill(code === "el" ? GR[gi++ % GR.length] : `Testo italiano ${i}`); }
    else { continue; }
    filled++;
  }
  return { n, filled };
}
await go(page, `/projects/${PID}/routes/${ids.route}`); await wait();
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(600);
const r = await fillPanel("el"); console.log("route el filled", r, await tabs());
await shot(page, "route-editor__el-filled");
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
console.log("route after save", await tabs(), (await page.locator("main").innerText()).split("\n").slice(3,8).join("/"));
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(500);
await page.locator("#panel-el").getByText("Stop texts").scrollIntoViewIfNeeded();
await shot(page, "route-editor__el-stops", "1440", false);
// Guide
await go(page, `/projects/${PID}/guides/${ids.guide}`); await wait();
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(600);
const g = await fillPanel("el"); console.log("guide el filled", g, await tabs());
await shot(page, "guide-editor__el-filled");
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
console.log("guide after save", await tabs());
await browser.close();
