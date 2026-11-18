import { start, go, P, shotDir } from "./common.mjs";
const s = await start(); const p=s.page;
await go(p, P); await p.waitForTimeout(800);
for (const [name,sel] of [["Points of Interest","main tbody tr"],["Routes","main tbody tr"],["Guides","main tbody tr"],["Media","main img, main [role=listitem], main tbody tr"],["Places","main tbody tr"],["Points of Interest","main tbody tr"]]) {
  await p.getByRole("link",{name,exact:true}).first().click(); const t=Date.now();
  await p.locator(sel).first().waitFor({timeout:20000}).catch(()=>console.log("none",name));
  const t1=Date.now()-t;
  await p.waitForLoadState("networkidle"); console.log(name,"first row ms",t1,"idle ms",Date.now()-t, "rows", await p.locator("main tbody tr").count());
}
await s.browser.close();
