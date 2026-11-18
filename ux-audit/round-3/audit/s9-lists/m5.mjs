import { open, go, P, shot, settle } from "./h.mjs";
for (const vp of ["1280","1024"]) {
const { browser, page } = await open("admin", { viewport: vp });
await go(page, `/projects/${P}/routes`); await settle(page, 2000);
await page.evaluate(()=>{const tr=[...document.querySelectorAll("main table tbody tr")].find(t=>/UX-R3-p3 Route/.test(t.innerText)); tr.scrollIntoView({block:"center"});}); await settle(page,400);
await shot(page, `routes__long-greek-word__${vp}`);
await browser.close();
}
