import { open, go } from "../../../../tools/session.mjs";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const { browser, page } = await open("admin", { viewport: process.argv[2] ?? "1440" });
const dump = () => page.evaluate(() => {
  const inner = document.querySelector("main > div");
  const kids = [...(inner?.children ?? [])];
  const r = (el) => { const b = el.getBoundingClientRect(); return `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} top=${Math.round(b.top)} h=${Math.round(b.height)} w=${Math.round(b.width)}`; };
  const out = kids.map(r);
  const head = kids[0]; if (head) out.push("  head> " + [...head.querySelectorAll("h1,p")].map(r).join(" | "));
  const tr = document.querySelector("main tbody tr"); if (tr) out.push("  firstrow " + r(tr) + " thead " + r(document.querySelector("main thead")));
  return out;
});
for (const [n, path] of [["dashboard", `/projects/${P}`], ["pois", `/projects/${P}/pois`], ["places", `/projects/${P}/places`], ["media", `/projects/${P}/media`], ["poi-editor", `/projects/${P}/pois`]]) {
  await go(page, path); await page.waitForTimeout(1500);
  if (n === "poi-editor") { await page.locator("main tbody tr a").first().click(); await page.waitForTimeout(2500); }
  console.log("== " + n); console.log((await dump()).join("\n"));
}
await browser.close();
