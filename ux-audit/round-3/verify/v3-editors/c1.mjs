import { open, go, shot, wait, url, ids, active, txt, live, liveLog } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("pois", ids.poiDraft)); await wait(page, 1800);
await live(page);
// pick an indented place via select
const sel = page.locator("select").first();
const opts = await sel.locator("option").allTextContents();
console.log("options sample", JSON.stringify(opts.slice(0,6)));
const target = opts.find(o=>/Excavation Hall/.test(o));
await sel.selectOption({ label: target });
await wait(page,300);
console.log("closed value:", JSON.stringify(await sel.evaluate(s=>s.selectedOptions[0].textContent)));
await shot(page,"poi-draft__place-picked__1440");
// header badge + side card before activation
const hdr = () => page.locator(".editor-header").innerText().then(t=>t.replace(/\n+/g," | "));
console.log("HEADER:", await hdr());
console.log("SIDE:", await page.locator("aside").innerText().then(t=>t.replace(/\n+/g," | ")));
// Save
await page.getByRole("button",{name:/^Save/}).first().click(); await wait(page,1800);
console.log("after save HEADER:", await hdr());
console.log("live:", JSON.stringify(await liveLog(page)));
// Activate
await page.getByRole("button",{name:"Activate"}).first().click(); await wait(page,1000);
const d = page.getByRole("dialog");
console.log("DIALOG:", await d.innerText().then(t=>t.replace(/\n+/g," | ")));
await shot(page,"poi-draft__activate-confirm__1440");
console.log("links in dialog:", await d.locator("a,button").evaluateAll(bs=>bs.map(b=>b.tagName+":"+b.textContent.trim().slice(0,40))));
await browser.close();
