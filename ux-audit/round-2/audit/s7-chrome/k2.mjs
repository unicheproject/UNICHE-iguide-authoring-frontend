import { open, go, shot, run, CMS, POP, AP, problem, t, focusDesc } from "./lib.mjs";
await run(async () => {
  const { browser, context, page } = await open("curator", { viewport: "1440" });
  await context.grantPermissions(["clipboard-read","clipboard-write"]).catch(()=>{});
  await page.route(AP, (r) => (new RegExp(`/projects/${POP}$`).test(r.request().url().split("?")[0]) && r.request().method()==="GET") ? r.fulfill(problem(503,"X")) : r.continue());
  await page.goto(CMS+`/projects/${POP}/dashboard`); await page.waitForTimeout(2500);
  const copy = page.getByRole("button",{name:/copy/i}); console.log("copy btn", await copy.evaluate(e=>e.outerHTML.slice(0,200)));
  await copy.click(); await page.waitForTimeout(300);
  console.log("after click label:", await copy.innerText(), "| live region:", await page.evaluate(()=>[...document.querySelectorAll("[aria-live]")].map(e=>e.innerText).join("|")));
  await page.getByRole("button",{name:/try again/i}).click(); await page.waitForTimeout(1500); console.log("after try again focus", await focusDesc(page));
  await browser.close();
});
