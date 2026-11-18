import { open, go } from "../../../tools/session.mjs";
import { shot, text } from "./lib.mjs";
for (const vp of ["1440","1280","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, "/projects/new");
  await page.waitForTimeout(1200);
  await shot(page, `wizard-1__pristine__${vp}`);
  const m = await page.evaluate(() => {
    const li = [...document.querySelectorAll("nav[aria-label='Create Project progress'] li")].map(l => { const b = l.getBoundingClientRect(); const c = l.querySelector("span.rounded-full").getBoundingClientRect(); return {x:Math.round(b.x), y:Math.round(b.y), w:Math.round(b.width), circleY:Math.round(c.y), circleX: Math.round(c.x), txt:l.innerText.replace(/\n/g," / ")}; });
    const h2 = document.querySelector("#step-heading").getBoundingClientRect();
    const card = document.querySelector("form").getBoundingClientRect();
    const name = document.querySelector("input[placeholder^='e.g. Cycl']")?.getBoundingClientRect();
    return {li, h2:[h2.x,h2.y], card:[card.x,card.y,card.width,card.height], inputY: name?.y, docH: document.documentElement.scrollHeight, vh: innerHeight, sw: document.documentElement.scrollWidth};
  });
  console.log(vp, JSON.stringify(m));
  if (vp==="1440") {
    console.log("TEXT\n", await text(page));
    // empty submit
    await page.getByRole("button", { name: /create project|continue|next/i }).last().click();
    await page.waitForTimeout(600);
    await shot(page, `wizard-1__empty-errors__1440`);
    console.log("ERR TEXT\n", await page.evaluate(()=>document.querySelector("form").innerText));
    console.log("focus", await page.evaluate(()=>document.activeElement?.outerHTML.slice(0,120)));
    // invalid slug
    await page.getByLabel("Project name").fill("x");
    await page.getByLabel(/^Slug/).fill("Bad Slug!");
    await page.getByRole("button", { name: /create project|continue|next/i }).last().click();
    await page.waitForTimeout(600);
    await shot(page, `wizard-1__slug-error__1440`);
    console.log("ERR2\n", await page.evaluate(()=>document.querySelector("form").innerText));
  }
  await browser.close();
}
