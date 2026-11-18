import { open, go, dash, B, settle } from "./h.mjs";
import { writeFileSync } from "node:fs";
const { browser, page } = await open("admin", { viewport: "1440" });
const seen = {};
page.on("response", async r => { const u = new URL(r.url()); if (!u.pathname.includes("/api/v1/")) return; const k = u.pathname.replace(/[0-9a-f-]{36}/g, ":id") + u.search; if (seen[k]) return; try { const t = await r.text(); seen[k] = { status: r.status(), body: t.slice(0, 1500) }; } catch {} });
await go(page, dash(B)); await settle(page, 3000);
writeFileSync(new URL("./shapes.json", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), JSON.stringify(seen, null, 1));
await browser.close();
