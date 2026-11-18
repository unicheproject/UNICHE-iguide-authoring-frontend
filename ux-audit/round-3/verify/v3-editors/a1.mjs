import { open, go, shot, wait, url, ids, active, txt, live, liveLog } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, url("pois", ids.poiDraft)); await wait(page, 2000);
await shot(page, "poi-draft__top__1440");
console.log(await txt(page, "main"));
// sticky chrome
const m = await page.evaluate(() => { const out=[]; for (const e of document.querySelectorAll("*")) { const cs=getComputedStyle(e); if ((cs.position==="sticky"||cs.position==="fixed")) { const b=e.getBoundingClientRect(); if (b.height>0 && b.top<200) out.push(`${e.tagName}.${(e.className||"").toString().slice(0,50)} top${Math.round(b.top)} h${Math.round(b.height)} w${Math.round(b.width)}`);} } return out; });
console.log(m.join("\n"));
console.log("buttons", await page.locator("button:visible").evaluateAll(bs=>bs.map(b=>(b.getAttribute("aria-label")||b.textContent).trim().slice(0,30)).filter(Boolean).join(" | ")));
await browser.close();
