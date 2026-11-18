import { open, go, P, settle } from "./h.mjs";
const { browser, page } = await open("admin", { viewport: "1440" });
await go(page, `/projects/${P}/guides?q=guide%20rtl`); await settle(page, 1800);
await page.screenshot({ path: new URL("./shots/guides__rtl-title-crop__1440.png", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), clip: { x: 256, y: 150, width: 760, height: 200 } });
await browser.close();
