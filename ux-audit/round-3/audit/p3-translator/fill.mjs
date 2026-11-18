import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const kind = process.argv[2];
const { browser, page } = await open("admin", { viewport: "1440" });
const snap = async (label) => {
  const s = await page.evaluate(()=>{
    const tabs=[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," ").trim());
    const head=[...document.querySelectorAll("button")].filter(b=>/warning|to fix|Nothing to fix/i.test(b.innerText)&&b.getBoundingClientRect().y<120).map(b=>b.innerText.trim().slice(0,60));
    const card=[...document.querySelectorAll("button")].filter(b=>/^(Warning|Blocking)/.test(b.innerText)).map(e=>e.innerText.trim());
    return {tabs,head,card};
  });
  console.log(label, JSON.stringify(s));
};
await go(page, R[kind]);
await page.waitForSelector("h1"); await page.waitForTimeout(1500);
const text = { el: "Ελληνικό κείμενο", it: "Testo italiano" };
for (const l of ["el","it"]) {
  await page.getByRole("tab",{name: l==="el"?/Ελληνικά/:/Italiano/}).click();
  await page.waitForTimeout(500);
  await snap(`${kind} ${l} start`);
  const fields = await page.locator("main [role=tabpanel] textarea, main [role=tabpanel] input[type=text], main [role=tabpanel] input:not([type])").elementHandles();
  let i=0;
  for (const f of fields) {
    if (!(await f.isVisible())) continue;
    const id = await f.getAttribute("id");
    if (!id) continue;
    await f.fill(`${text[l]} ${++i}`);
    if (i===1 || i===3) await snap(`${kind} ${l} after field ${i}`);
  }
  await snap(`${kind} ${l} all filled`);
  await shot(page, `${kind}-editor__${l}-filled__1440`, true);
}
await page.getByRole("button",{name:/^Save/}).first().click();
await page.waitForTimeout(2500);
await snap(`${kind} saved`);
await browser.close();
