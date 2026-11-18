import { open, go, rec, P, tall, ready } from "./h.mjs";
const kinds = { route:`routes/${rec.route}`, guide:`guides/${rec.guide}`, event:`events/${rec.event}`, category:`categories/${rec.category}` };
const { browser, page } = await open("curator", { viewport: "1440" });
for (const [k,p] of Object.entries(kinds)) { await go(page, `/projects/${P}/${p}`); await ready(page,1200); console.log(k, await tall(page, `${k}-editor__draft-tall__1440`)); }
await browser.close();
