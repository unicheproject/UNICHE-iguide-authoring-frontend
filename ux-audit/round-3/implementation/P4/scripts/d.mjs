import { open, go } from "../../../../tools/session.mjs";
const {browser,page}=await open("admin",{viewport:"1440"});
await go(page,`/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/1e3e76c9-d9c2-48eb-8419-e54b7143180c`); await page.waitForSelector("[data-trigger-row]");
console.log(await page.evaluate(()=>[...document.querySelectorAll("[data-trigger-row] button")].map(b=>b.textContent.trim()+"|"+b.getAttribute("aria-expanded"))));
await browser.close();
