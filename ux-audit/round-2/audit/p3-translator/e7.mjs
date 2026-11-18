import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
const wait = async () => { await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(1500); };
const tabs = async () => (await page.locator("[role=tab]").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")))).join(" / ");
await go(page, `/projects/${PID}/routes/${ids.route}`); await wait();
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(600);
// fix title with real Greek
await page.getByLabel("Title in Ελληνικά").fill("UX-R2-p3 Βόλτα στην Αγορά");
// stop 1: use Copy source on walking instructions then overwrite; others typed
const stops = await page.locator("[id^=stop-navigationInstructions-]").evaluateAll(e => e.filter(x=>x.matches("input,textarea")).map(x => x.id.replace("stop-navigationInstructions-", "")));
let n = 0;
for (const id of stops) {
  n++;
  await page.locator(`#stop-navigationInstructions-${id}`).fill(n === 1 ? "Ξεκινήστε στην πύλη." : "Συνεχίστε στο σηματοδοτημένο μονοπάτι.");
  await page.locator(`#stop-description-${id}`).fill(`Περιγραφή της στάσης ${n} στα ελληνικά.`);
  await page.locator(`#stop-narrative-${id}`).fill(`Αφήγηση της στάσης ${n}: μια σύντομη ιστορία.`);
}
console.log("tabs after stops typed:", await tabs());
await page.getByLabel("Title at this stop in Ελληνικά").first().scrollIntoViewIfNeeded();
await shot(page, "route-editor__el-stops", "1440", false);
await page.getByRole("button", { name: /Copy source/ }).nth(8).click().catch(e=>console.log("cs",e.message.slice(0,80)));
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
console.log("after save", await tabs());
// Italian: next missing from Greek
await page.getByRole("tab", { name: /Italiano/ }).click(); await page.waitForTimeout(400);
await page.getByLabel("Title in Italiano").fill("UX-R2-p3 Passeggiata nell'Agorà");
await page.getByLabel("Summary in Italiano").fill("Una dolce passeggiata tra tre tappe.");
const stopsIt = await page.locator("[id^=stop-description-]").evaluateAll(e => e.filter(x=>x.matches("input,textarea")).map(x => x.id));
console.log("it stop fields", stopsIt.length);
await page.locator(stopsIt[0].replace(/^/, "#")).fill("Descrizione della prima tappa.");
console.log("tabs:", await tabs());
await page.keyboard.press("Control+s"); await page.waitForTimeout(2500);
await shot(page, "route-editor__it-partial");
console.log("saved tabs:", await tabs());
await browser.close();
