import { open, go, shot, axe, run, CMS, t, focusDesc, AP } from "./lib.mjs";
await run(async () => {
  const { browser, context, page } = await open("admin", { viewport: "1440" });
  const writes=[]; page.on("request",r=>{ if(r.method()!=="GET" && /localhost:8080/.test(r.url())) writes.push(r.method()+" "+r.url().replace(/.*v1/,"")); });
  console.log("slug placeholder?", await (async()=>{ await go(page,"/projects/new"); await page.waitForTimeout(1200); return page.evaluate(()=>[...document.querySelectorAll("input")].map(i=>i.id+" val='"+i.value+"' ph='"+i.placeholder+"' color="+getComputedStyle(i).color)); })());
  await go(page, "/"); await page.waitForTimeout(2500);
  const grp = page.getByText(/Needs setup/).first(); await grp.click(); await page.waitForTimeout(600);
  await shot(page,"home__needs-setup-open","1440");
  console.log("needs-setup text:", (await t(page,"main")).split("Needs setup")[1]?.slice(0,500).replace(/\n+/g," | "));
  const btn = page.getByRole("button",{name:/resume initialization/i}).or(page.getByRole("link",{name:/resume initialization/i})).first();
  console.log("resume el:", await btn.evaluate(e=>e.tagName+" "+(e.getAttribute("aria-label")||"")+" "+e.getAttribute("href")));
  await btn.click(); await page.waitForTimeout(3500);
  console.log("url", page.url(), "title", await page.title(), "focus", await focusDesc(page));
  console.log((await t(page,"main")).slice(0,1500));
  await shot(page,"wizard__resume-step2-top","1440"); await shot(page,"wizard__resume-step2-full","1440",true);
  await axe(page,"wizard2");
  console.log("writes", writes);
  await browser.close();
});
