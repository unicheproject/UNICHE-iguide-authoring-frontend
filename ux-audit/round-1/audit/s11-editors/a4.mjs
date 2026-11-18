import { start, goP, log, dump, state, focused } from "./lib.mjs";
const s = await start("1440"); const { page } = s;
await page.goto("http://localhost:5173" + state().routeUrl); await page.waitForTimeout(2000);
await s.tall("route-editor__draft-0-stops-tall");
await page.getByRole("button", { name: /add stop/i }).click();
await page.waitForTimeout(800);
await s.shot("route-picker__open");
log(await dump(page, "[role=dialog]"));
await s.browser.close();
