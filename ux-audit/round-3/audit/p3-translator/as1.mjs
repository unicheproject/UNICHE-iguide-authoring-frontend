import { open, go, base, shot } from "./lib.mjs";
import { readFileSync } from "node:fs";
const A = readFileSync("ux-audit/round-3/audit/p3-translator/asset.txt","utf8").trim();
const { browser, page } = await open("admin", { viewport: "1440" });
const tabs = async (l) => console.log(l, await page.evaluate(()=>[...document.querySelectorAll("[role=tab]")].map(t=>t.innerText.replace(/\s+/g," ")).join(" / ")+" || "+[...document.querySelectorAll("button")].filter(b=>/^(Warning|Blocking)/.test(b.innerText)).map(e=>e.innerText.trim()).join(" | ")+" || HEAD "+[...document.querySelectorAll("button,span")].filter(b=>b.getBoundingClientRect().y<190&&b.children.length<3&&/warning|fix|Nothing/i.test(b.innerText)).map(e=>e.innerText.trim().replace(/\s+/g," ")).join(" | ")));
const fields = async (l) => console.log(l, await page.evaluate(()=>[...document.querySelectorAll("main input,main textarea,main select,main button,main [role=tab],main [role=switch]")].filter(e=>e.offsetParent).map(e=>`${e.tagName.toLowerCase()} ${e.id}|${(e.getAttribute("aria-label")||e.labels?.[0]?.innerText||e.innerText||"").trim().replace(/\s+/g," ").slice(0,55)}`).join("\n")));
await go(page, A);
await page.waitForSelector("h1"); await page.waitForTimeout(2000);
await shot(page,"asset-editor__default__1440",true);
await fields("DEFAULT"); await tabs("default");
for (const l of ["el","it"]) { await go(page, A+"?lang="+l); await page.waitForSelector("h1"); await page.waitForTimeout(1800); await shot(page,`asset-editor__${l}-tab__1440`,true); await fields(l.toUpperCase()); await tabs(l);}
await browser.close();
