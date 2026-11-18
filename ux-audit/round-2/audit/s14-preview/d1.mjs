import { open, go, shot, POP, t, focusDesc, run } from "./lib.mjs";
const tab = (page, n) => page.getByRole("tab", { name: n, exact: true });
await run(async () => {
  const { browser, page } = await open("curator", { viewport: "1280" });
  await go(page, `/projects/${POP}/preview`); await page.waitForTimeout(1200);
  const stat = async () => (await t(page,"main")).split("\n").filter(l=>/Fired|trigger|Drafts|Live|pending|missing|Reset|opened|not offered/i.test(l)).join(" | ");
  // Working text of pending item
  const body = async () => (await page.locator("[data-preview-frame]").innerText()).replace(/\n+/g," ");
  const w = await body(); console.log("WORKING has 'Pending edit'", /Pending edit/.test(w), "| 'revised'", /revised/i.test(w));
  await tab(page,"Live").click(); await page.waitForTimeout(500);
  const l = await body(); console.log("LIVE has 'Pending edit'", /Pending edit/.test(l));
  console.log("live status:", await stat());
  console.log("LIVE sample:", l.slice(0,400));
  await shot(page,"preview__live-mode","1280");
  await tab(page,"Working").click(); await page.waitForTimeout(500);
  // options
  const opts = await page.locator("#fire-trigger option, #fire-trigger optgroup").evaluateAll(es=>es.map(e=>e.tagName+":"+(e.label||e.textContent)).slice(0,6));
  console.log(opts);
  // fire a QR trigger
  await page.selectOption("#fire-trigger", { index: 1 });
  await page.getByRole("button",{name:/^Fire/}).click(); await page.waitForTimeout(700);
  console.log("after fire:", await stat());
  await shot(page,"preview__fired","1280");
  console.log("live regions:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map(e=>(e.getAttribute("role")||"")+"/"+e.getAttribute("aria-live")+":"+e.textContent.trim().slice(0,100))));
  console.log("fired screen:", (await body()).slice(0,300));
  console.log("select value after fire:", await page.inputValue("#fire-trigger"));
  // change surface -> cleared?
  await tab(page,"Mobile").click(); await page.waitForTimeout(500);
  console.log("after surface change:", await stat());
  // fire beacon on mobile
  const beacon = await page.locator("#fire-trigger optgroup").evaluateAll(es=>es.map(e=>e.label));
  console.log("groups mobile", beacon);
  await page.selectOption("#fire-trigger", { index: 1 });
  await page.getByRole("button",{name:/^Fire/}).click(); await page.waitForTimeout(500);
  console.log("mobile fired:", await stat());
  await tab(page,"Ελληνικά").click(); await page.waitForTimeout(500);
  console.log("after lang change:", await stat());
  await page.selectOption("#fire-trigger", { index: 1 }); await page.getByRole("button",{name:/^Fire/}).click(); await page.waitForTimeout(400);
  await tab(page,"Live").click(); await page.waitForTimeout(500);
  console.log("after mode change:", await stat());
  await tab(page,"Working").click();
  await page.selectOption("#fire-trigger", { index: 1 }); await page.getByRole("button",{name:/^Fire/}).click(); await page.waitForTimeout(400);
  await page.getByRole("button",{name:/Reset/}).click(); await page.waitForTimeout(400);
  console.log("after reset:", await stat(), "| focus", await focusDesc(page));
  await shot(page,"preview__greek-mobile","1280");
  console.log("greek screen:", (await body()).slice(0,300));
  await browser.close();
});
