import { open, go, shot, POP, t, run, axe, focusDesc } from "./lib.mjs";
const PLAN = "3b81f75c-3a3e-45a2-9676-89f1d283457b";
await run(async () => {
  for (const vp of ["1440","1024","768","zoom200"]) {
    const { browser, page } = await open("admin", { viewport: vp });
    page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0,200)));
    await go(page, `/projects/${POP}/floor-plans/${PLAN}`);
    await page.waitForTimeout(1500);
    await shot(page, "plan-editor__default", vp, true);
    await shot(page, "plan-editor__fold", vp);
    console.log(vp, "plane", await page.locator("img").first().evaluate(i=>{const r=i.getBoundingClientRect();return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]}), "vh", page.viewportSize().height);
    if (vp==="1440") {
      const btns = await page.getByRole("button", { name: /^Place .* on the plan$/ }).count();
      console.log("place btns", btns);
      console.log((await t(page,"main")).slice(0,1500));
      await axe(page, "plan-editor");
    }
    await browser.close();
  }
});
