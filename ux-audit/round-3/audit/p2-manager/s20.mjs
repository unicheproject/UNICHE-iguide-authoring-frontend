import { open, go } from "../../../tools/session.mjs";
import { shot, AxeBuilder } from "./lib.mjs";
// find an un-initialised project id via the Home list
let id;
{ const { browser, page } = await open("admin", { viewport: "1440" });
  await go(page, "/"); await page.waitForTimeout(1500);
  await page.getByRole("button",{name:/Needs setup/}).click(); await page.waitForTimeout(1200);
  id = await page.evaluate(()=>{ const a=[...document.querySelectorAll("a")].find(a=>/resume=/.test(a.href)&&!/R3/.test(a.closest("li,div")?.innerText||"")); return a?.href.split("resume=")[1]; });
  console.log("resume id", id); await browser.close(); }
for (const vp of ["1280","768","zoom200"]) {
  const { browser, page } = await open("admin", { viewport: vp });
  await go(page, "/projects/new?resume="+id); await page.waitForTimeout(2000);
  const meas = async (tag) => { const m = await page.evaluate(()=>{
    const li=[...document.querySelectorAll("nav[aria-label='Create Project progress'] li")].map(l=>{const c=l.querySelector("span.rounded-full").getBoundingClientRect(); const b=l.getBoundingClientRect(); return {circleY:Math.round(c.y*10)/10, h:Math.round(b.height)}});
    const f=document.querySelector("footer, form > div:last-child").getBoundingClientRect();
    const btn=[...document.querySelectorAll("form button")].filter(b=>/Continue|Initialize|Back/.test(b.textContent)).map(b=>{const r=b.getBoundingClientRect(); return [b.textContent.trim(), Math.round(r.y), Math.round(r.bottom), Math.round(r.height)]});
    return {li, btn, vh:innerHeight, docH:document.documentElement.scrollHeight, sw:document.documentElement.scrollWidth}});
    console.log(vp, tag, JSON.stringify(m)); };
  await shot(page, `wizard-2__resume-pristine__${vp}`); await meas("step2");
  await page.locator("label",{hasText:"Outdoor trail"}).click(); await page.waitForTimeout(1000);
  await shot(page, `wizard-2__template-chosen__${vp}`, true); await meas("step2-chosen");
  let ax = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log(vp,"axe step2", ax.violations.map(v=>v.id+":"+v.impact));
  await page.getByRole("button",{name:/^Continue$/}).click(); await page.waitForTimeout(1000);
  await shot(page, `wizard-3__languages__${vp}`, true); await meas("step3");
  ax = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log(vp,"axe step3", ax.violations.map(v=>v.id+":"+v.impact));
  await page.getByRole("button",{name:/Continue to review/}).click(); await page.waitForTimeout(1000);
  await shot(page, `wizard-4__review__${vp}`, true); await meas("step4");
  ax = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze(); console.log(vp,"axe step4", ax.violations.map(v=>v.id+":"+v.impact));
  await browser.close();
}
