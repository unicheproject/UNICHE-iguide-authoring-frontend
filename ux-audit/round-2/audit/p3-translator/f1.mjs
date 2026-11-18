import { open, go, PID, shot, fs, SH } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${PID}/pois/${ids.poi}`);
await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(2000);
await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(800);
const r = await page.evaluate(async () => {
  await document.fonts.ready;
  const faces = [...document.fonts].map(f => `${f.family}|${f.weight}|${f.status}|${f.unicodeRange.slice(0,40)}`);
  const c = document.createElement("canvas").getContext("2d");
  const out = {};
  for (const [name, txt] of [["H", "H"], ["Η", "Η"], ["x", "x"], ["χ", "χ"], ["o", "o"], ["ο", "ο"], ["d", "d"], ["δ", "δ"], ["l", "l"], ["λ", "λ"]]) { c.font = "600 16px 'Montserrat Variable'"; const m = c.measureText(txt); out[name] = `asc=${m.actualBoundingBoxAscent.toFixed(2)} w=${m.width.toFixed(2)}`; }
  const lab = [...document.querySelectorAll("label")].find(l => /Title in Ελληνικά/.test(l.innerText));
  const bdi = lab?.querySelector("bdi");
  return { faces, out, labFont: getComputedStyle(lab).fontFamily, size: getComputedStyle(lab).fontSize, bdiLang: bdi?.lang, tabLang: [...document.querySelectorAll("[role=tab] bdi, [role=tab] [lang]")].map(x => x.lang + ":" + x.innerText.slice(0,10)) };
});
console.log(JSON.stringify(r, null, 1));
const lab = page.locator("label", { hasText: "Title in Ελληνικά" }).first();
const box = await lab.boundingBox();
await page.screenshot({ path: SH + "greek-mixed-label__crop__1440.png", clip: { x: box.x - 4, y: box.y - 4, width: 260, height: box.height + 8 } });
// device scale 3 crop
await browser.close();
