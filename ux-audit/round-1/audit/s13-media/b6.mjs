import { start, go, P } from "./common.mjs";
import { writeFileSync, readdirSync } from "node:fs";
const vp = process.argv[2] ?? "1440";
const dir = new URL("./files/", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
writeFileSync(dir+"UX-s13-media toobig.png", Buffer.alloc(21*1024*1024, 7));
const files = readdirSync(dir).map(f=>dir+f);
const s = await start(vp); const { page } = s;
let failWav = true;
await page.route(/\/assets$/, async (route) => {
  const r = route.request();
  if (r.method() !== "POST") return route.continue();
  const body = r.postData() ?? "";
  const buf = r.postDataBuffer(); const txt = buf ? buf.slice(0,400).toString("latin1") : "";
  if (failWav && txt.includes("tone.wav")) return route.fulfill({status:503, contentType:"application/problem+json", body: JSON.stringify({type:"urn:uniche:iguide:problem:SERVICE_UNAVAILABLE",title:"Service unavailable",status:503,detail:"Storage is unavailable.",code:"SERVICE_UNAVAILABLE",requestId:"11111111-2222-3333-4444-555555555555"})});
  await new Promise(r=>setTimeout(r,2500)); return route.continue();
});
await go(page, `${P}/media`); await page.waitForSelector("main ul li a");
const before = await page.locator("main ul li").count();
await page.getByRole("button",{name:"Upload"}).click(); await page.waitForTimeout(800);
await page.locator("input[type=file]").setInputFiles(files);
await page.waitForTimeout(700);
await s.shot("upload__queued-progress");
console.log("live:", await page.evaluate(()=>[...document.querySelectorAll("[role=dialog] [aria-live]")].map(e=>e.textContent).join("~")));
// cancel the last queued one
const cancels = page.getByRole("button",{name:/^Cancel UX-s13/});
console.log("cancel buttons", await cancels.count());
await page.getByRole("button",{name:/^Cancel UX-s13-media tool\.exe/}).click(); await page.waitForTimeout(300);
await page.waitForTimeout(2000); await s.shot("upload__progress-midway"); await page.waitForTimeout(12000);
await s.shot("upload__mixed-results");
console.log(await page.evaluate(()=>[...document.querySelectorAll("[role=dialog] li")].map(l=>l.innerText.replace(/\n+/g," | ")).join("\n")));
console.log("live:", await page.evaluate(()=>[...document.querySelectorAll("[role=dialog] [aria-live]")].map(e=>e.textContent).join("~")));
console.log("summary", await page.evaluate(()=>document.querySelector("[role=dialog]").innerText.match(/\d+ of \d+ uploaded.*/)?.[0]));
// retry wav
failWav = false;
await page.getByRole("button",{name:/Retry UX-s13-media tone.wav/}).click(); await page.waitForTimeout(5000);
await s.shot("upload__after-retry");
console.log("live:", await page.evaluate(()=>[...document.querySelectorAll("[role=dialog] [aria-live]")].map(e=>e.textContent).join("~")));
// retry too-big disabled?
console.log("toobig retry disabled", await page.getByRole("button",{name:/Retry UX-s13-media toobig/}).isDisabled());
await page.getByRole("button",{name:"Done"}).click(); await page.waitForTimeout(800);
await s.shot("library__after-upload");
console.log("count before", before, "after", await page.locator("main ul li").count());
await s.browser.close();
