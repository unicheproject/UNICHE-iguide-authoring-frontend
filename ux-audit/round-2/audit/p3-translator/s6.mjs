import { open, go, PID, shot, listReady } from "./lib.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
const rows = async () => { const t = await page.locator("main").innerText(); return t.match(/Showing[^\n]*/)?.[0] ?? t.match(/No [^\n]*match[^\n]*/)?.[0]; };
const titles = async () => page.locator("main a[href*='/pois/'], main a[href*='/places/']").evaluateAll(e => e.slice(0,6).map(x => x.innerText.replace(/\n/g," ")));
async function q(kind, text, lang) {
  await go(page, `/projects/${PID}/${kind}?q=${encodeURIComponent(text)}${lang ? "&lang=" + lang : ""}`); await listReady(page); await page.waitForTimeout(800);
  console.log(`${kind} q=${text} lang=${lang ?? "all"} ->`, await rows(), JSON.stringify(await titles()));
}
await q("places", "Αθήνας"); await q("places", "αθηνας"); await q("places", "ΑΘΗΝΑΣ"); await q("places", "Ιστορικο Κεντρο", "el"); await q("places", "Ιστορικό Κέντρο", "en"); await q("places", "Ιστορικό Κέντρο", "it");
await q("pois", "Στοά"); await q("pois", "στοα"); await q("pois", "ΣΤΟΑ", "el"); await q("pois", "Στοά", "en"); await q("pois", "Galleria", "it"); await q("pois", "stoa", "all");
await q("pois", "Ακροπολη"); await q("pois", "Ζωφόρος"); await q("pois", "zoforos");
await go(page, `/projects/${PID}/pois?q=${encodeURIComponent("Στοά")}`); await listReady(page); await page.waitForTimeout(800); await shot(page, "pois-search__greek-stoa-all");
await go(page, `/projects/${PID}/pois?q=${encodeURIComponent("Ζωφόρος")}`); await listReady(page); await page.waitForTimeout(800); await shot(page, "pois-search__greek-match-english-title");
console.log((await page.locator("main").innerText()).replace(/\n+/g," | ").slice(700, 1500));
await browser.close();
