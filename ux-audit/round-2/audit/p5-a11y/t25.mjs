import * as L from "./lib.mjs";
const { page, browser } = await L.open("curator", { viewport: "1440" });
await L.nav(page, L.P("/categories/ca8a9d3c-85c8-4c3a-b522-2309120772ac"), 1500);
await L.shot(page, "category-editor__fresh__1440", true);
const s = await L.snap(page, "category-editor", "main");
L.log("t25", s.split("\n").slice(0, 80).join("\n"));
await browser.close();
