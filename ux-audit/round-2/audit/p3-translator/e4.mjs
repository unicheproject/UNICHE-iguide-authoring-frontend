import { open, go, PID, shot, fs } from "./lib.mjs";
const ids = JSON.parse(fs.readFileSync(new URL("./ids.json", import.meta.url)));
const { browser, page } = await open("curator", { viewport: "1440" });
const wait = async (s) => { await page.waitForFunction(() => document.querySelector("h1")?.innerText.includes("UX-R2"), null, { timeout: 40000 }).catch(()=>{}); await page.waitForTimeout(1500); };
const tabs = async () => (await page.locator("[role=tab]").evaluateAll(e => e.map(x => x.innerText.replace(/\n/g," ")))).join(" / ");
const struct = () => page.evaluate(() => { const m = document.querySelector("main"); const bs = [...m.querySelectorAll("button")].map(b => (b.getAttribute("aria-label") || b.innerText).trim()).filter(Boolean); const c = {}; for (const b of bs) if (/move|remove|delete|add|up|down|position|reorder|new|drag/i.test(b)) c[b] = (c[b]||0)+1; return c; });
const active = () => page.evaluate(() => { const a = document.activeElement; return `${a?.tagName}|${a?.getAttribute("data-path")}|${a?.labels?.[0]?.innerText ?? a?.innerText?.slice(0,30)}`; });
for (const kind of ["routes", "guides"]) {
  await go(page, `/projects/${PID}/${kind}/${ids[kind === "routes" ? "route" : "guide"]}`); await wait();
  console.log(`== ${kind} en structural`, JSON.stringify(await struct()));
  await shot(page, `${kind.slice(0,-1)}-editor__en-tab`);
  await page.getByRole("tab", { name: /Ελληνικά/ }).click(); await page.waitForTimeout(800);
  console.log(`== ${kind} el structural`, JSON.stringify(await struct()), "tabs:", await tabs());
  await shot(page, `${kind.slice(0,-1)}-editor__el-tab`);
  console.log((await page.locator("main").innerText()).replace(/\n+/g," | ").slice(0, 1800));
}
await browser.close();
