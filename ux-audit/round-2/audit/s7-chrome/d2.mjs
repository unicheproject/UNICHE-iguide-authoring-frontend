import { open, go, shot, axe, t, run, CMS, POP, AP, problem, focusDesc } from "./lib.mjs";
await run(async () => {
  const { browser, page } = await open("curator", { viewport: "1440" });
  await go(page, `/projects/${POP}/categories`); await page.waitForTimeout(2000);
  await page.getByRole("button", { name: /new category/i }).click(); await page.waitForTimeout(400);
  await page.locator("[role=dialog] input").first().fill("UX-R2-s7-chrome category");
  await page.locator("[role=dialog]").getByText("Points of Interest", {exact:true}).click();
  await page.getByRole("button", { name: /^create and open/i }).click();
  const t0 = Date.now();
  await page.waitForSelector("[role=status] strong, [role=alert] strong", { timeout: 8000 }).catch(()=>console.log("no toast seen"));
  await page.waitForTimeout(300);
  console.log("url", page.url(), "title", await page.title());
  const toastInfo = async () => page.evaluate(()=>[...document.querySelectorAll(".z-toast > div")].map(d=>d.getAttribute("role")+":"+d.innerText.replace(/\n/g," / ")));
  console.log("toasts at 0.3s", JSON.stringify(await toastInfo()));
  await shot(page,"toast__category-created","1440");
  // hover pause
  const tb = page.locator(".z-toast > div").first(); await tb.hover();
  await page.waitForTimeout(7000); console.log("after 7s hovered, still:", (await toastInfo()).length);
  await page.mouse.move(10, 400); await page.waitForTimeout(1800); console.log("1.8s after leave:", (await toastInfo()).length); await page.waitForTimeout(1500); console.log("3.3s after leave:", (await toastInfo()).length);
  await browser.close();
});
