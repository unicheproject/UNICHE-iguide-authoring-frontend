import { open, go, rec, P, shot, ready, tall } from "./h.mjs";
const { browser, page } = await open("curator", { viewport: "1440" });
await go(page, `/projects/${P}/pois/${rec.poiA}`); await ready(page);
console.log(await tall(page,"poi-editor__draft-new-tall__1440"));
await browser.close();
