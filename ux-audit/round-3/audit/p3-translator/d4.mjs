import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const R = JSON.parse(readFileSync("ux-audit/round-3/audit/p3-translator/records.json","utf8"));
const A = readFileSync("ux-audit/round-3/audit/p3-translator/asset.txt","utf8").trim();
const { browser, page } = await open("admin", { viewport: "1440" });
const pages = ["", "/places","/pois","/routes","/guides","/events","/categories","/maps","/media","/media?view=list","/preview","/launch","/audit-log"].map(p=>base+p).concat([R.pois,R.pois+"?lang=el",R.routes,R.guides,R.events,R.events+"?lang=el",R.categories,A,A+"?lang=it"]);
const re=/\b\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}\b|\b\d{1,2}:\d{2}\s?[AP]M\b|\b\d{4}-\d{2}-\d{2}\b|\bago\b|\d{2}:\d{2}:\d{2}|\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}(?:, \d{2}:\d{2})?|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}, \d{4}|Saved \d{1,2}:\d{2}|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+[.,]\d+ ?(?:km|m|min|MB|KB)\b/gi;
for (const p of pages) {
  await go(page, p.startsWith("http")?p:p);
  await page.waitForSelector("h1",{timeout:8000}).catch(()=>{}); await page.waitForTimeout(1800);
  const found = await page.evaluate((src)=>{const t=document.body.innerText; const rx=new RegExp(src,"gi"); const s=new Map(); for(const m of t.matchAll(rx)){ s.set(m[0], (s.get(m[0])||0)+1);} return [...s.entries()].slice(0,14).map(([k,v])=>k+(v>1?" x"+v:""));}, re.source);
  console.log(p.replace(base,"~").slice(0,70), "=>", found.join(" | "));
}
await browser.close();
