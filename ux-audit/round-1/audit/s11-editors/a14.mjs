import { start, goP, log, dump, state, focused } from "./lib.mjs";
const s = await start("1440"); const { page } = s;
page.on("response", r => { if (r.request().method() !== "GET" && r.url().includes("/api/")) log("NET", r.request().method(), r.url().replace(/.*iguide\/api\/v1\/projects\/[^/]+/, ""), r.status()); });
await page.goto("http://localhost:5173" + state().routeUrl); await page.waitForTimeout(3000);
await page.getByRole("button", { name: /apply changes/i }).first().click(); await page.waitForTimeout(1200);
await s.shot("route-active__apply-click");
log("dialog:", await dump(page, "[role=dialog],[role=alertdialog]").catch(()=>"none"));
const conf = page.getByRole("button", { name: /apply/i }).last();
await conf.click().catch(()=>{}); await page.waitForTimeout(2000);
await s.shot("route-active__after-apply");
log("alerts", await page.evaluate(()=>[...document.querySelectorAll("[role=alert],[role=status]")].map(e=>e.innerText.slice(0,200))));
// translations
await page.getByRole("tab", { name: /ελληνικά/i }).click(); await page.waitForTimeout(800);
await s.tall("route-translation-el-tall");
const t = await dump(page); log(t.slice(0,1800));
await s.browser.close();
