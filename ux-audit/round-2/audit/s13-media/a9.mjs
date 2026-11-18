import { open, go, shot, POP, axe, t, focusDesc, AP, problem } from "./lib.mjs";
const F = "ux-audit/round-2/audit/s13-media/fixtures/";
const { browser, page } = await open("curator", { viewport: "1440" });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
await go(page, `/projects/${POP}/media`);
await page.getByRole("heading",{level:1}).first().waitFor(); await page.waitForTimeout(2000);
await page.getByRole("button",{name:"Upload files"}).click(); await page.waitForTimeout(800);
const logTxt = async () => (await page.locator("[role=log]").allInnerTexts()).join(" || ").replace(/\n+/g," | ");
const dlg = async () => (await t(page,"[role=dialog]")).replace(/\n+/g," | ");
const inp = page.locator("input[type=file]");
// 1: mixed batch with 503 on first POST of alpha
let posts = 0;
await page.route(/\/assets$/, async (route) => {
  if (route.request().method()==="POST") { posts++; if (posts===1) return route.fulfill(problem(503,"SERVICE_UNAVAILABLE")); }
  return route.continue();
});
await inp.setInputFiles([F+"UX-R2-s13 alpha.png", F+"UX-R2-s13 beta.png", F+"UX-R2-s13 gamma.jpg", F+"UX-R2-s13 notes.txt", F+"UX-R2-s13 tool.exe", F+"UX-R2-s13 huge.png"]);
await page.waitForTimeout(4000);
console.log("LOG1", await logTxt());
console.log("DLG1", (await dlg()).slice(0,2500));
await shot(page,"upload__mixed-batch","1440");
const r=await axe(page,"upload-mixed"); for(const v of r.violations) for(const n of v.nodes) console.log(v.id, n.html.slice(0,260));

// retry
await page.getByRole("button",{name:/^Retry/}).click(); await page.waitForTimeout(2500);
console.log("LOG2", (await logTxt()).split(" || ")[0].slice(-600));
console.log("rows after retry", (await page.locator("ul[aria-label=Files] > li").allInnerTexts()).map(x=>x.replace(/\n+/g," | ")));
// hold decisions
await page.getByRole("button",{name:"Skip"}).first().click(); await page.waitForTimeout(500);
console.log("focus after skip", await focusDesc(page));
await page.getByRole("button",{name:"Upload anyway"}).first().click(); await page.waitForTimeout(3000);
console.log("LOG3", (await logTxt()).slice(-500));
console.log("rows", (await page.locator("ul[aria-label=Files] > li").allInnerTexts()).map(x=>x.replace(/\n+/g," | ")));
await shot(page,"upload__after-decisions","1440");
await browser.close();
