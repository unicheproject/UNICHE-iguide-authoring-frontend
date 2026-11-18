import { session, go, P, ids, LOG, shot, ax, sleep } from "./h.mjs";
const log = LOG(process.argv[2] ?? "ev");
const vps = (process.argv[3] ?? "1440").split(",");
for (const vp of vps) {
const { browser, page } = await session({ viewport: vp });
await page.addInitScript(() => {
  window.__live = [];
  const start = () => new MutationObserver((ms) => { for (const m of ms) { const t = (m.target.nodeType === 3 ? m.target.parentElement : m.target); const live = t?.closest?.("[aria-live],[role=status],[role=alert]"); if (live && live.textContent.trim()) window.__live.push(live.textContent.trim()); } }).observe(document.body, { subtree: true, childList: true, characterData: true });
  document.addEventListener("DOMContentLoaded", start);
});
await go(page, P(`/events/${ids.event}`));
await page.waitForSelector("[id^=occ-end-][id$=-day]", { timeout: 20000 }); await sleep(800);
const key = await page.evaluate(() => document.querySelector("[id^=occ-end-][id$=-day]").id.replace(/^occ-end-/, "").replace(/-day$/, ""));
const val = (id) => page.locator("#" + id).inputValue();
const end = async () => `${await val(`occ-end-${key}-day`)}/${await page.locator(`#occ-end-${key}-month`).inputValue()}/${await val(`occ-end-${key}-year`)} ${await val(`occ-end-${key}-hour`)}:${await val(`occ-end-${key}-minute`)}`;
log(vp, "end before", await end());
const err = async (part) => (await page.locator(`#occ-start-${key}-${part}-error`).count()) ? await page.locator(`#occ-start-${key}-${part}-error`).innerText() : null;
if (vp === "1440") {
  await page.evaluate(() => (window.__live.length = 0));
  await page.locator(`#occ-start-${key}-hour`).fill("25"); await page.locator(`#occ-start-${key}-minute`).focus(); await sleep(300);
  log("hour25 end", await end(), "err", await err("hour"));
  await shot(page, `event-hour25-${vp}`);
  await page.locator(`#occ-start-${key}-minute`).fill("61"); await page.locator(`#occ-start-${key}-year`).focus(); await sleep(300);
  log("minute61 end", await end(), "err", await err("minute"));
  await page.locator(`#occ-start-${key}-hour`).fill("14"); await page.locator(`#occ-start-${key}-minute`).fill("00");
  await page.locator(`#occ-start-${key}-day`).fill("31"); await page.locator(`#occ-start-${key}-month`).selectOption("2"); await page.locator(`#occ-start-${key}-year`).focus(); await sleep(300);
  log("31 Feb end", await end(), "err", await err("day"));
  await page.locator(`#occ-start-${key}-day`).fill(""); await page.locator(`#occ-start-${key}-hour`).focus(); await page.locator(`#occ-start-${key}-day`).focus(); await page.locator(`#occ-start-${key}-month`).focus(); await page.locator(`#occ-end-${key}-day`).focus(); await sleep(300);
  log("empty day end", await end(), "group err", await page.locator(`#occ-start-${key}-error`).count() ? await page.locator(`#occ-start-${key}-error`).innerText() : null);
  log("ended chip / legend while start invalid:", await page.locator("ol[aria-label] > li").first().innerText().then((t) => t.replace(/\s+/g, " ").slice(0, 120)));
  log("live log", await page.evaluate(() => [...new Set(window.__live)]));
  // aria wiring
  log("aria", await page.evaluate((k) => { const h = document.getElementById(`occ-start-${k}-hour`); return { invalid: h.getAttribute("aria-invalid"), desc: h.getAttribute("aria-describedby") }; }, key));
  // fix and see End follow
  await page.locator(`#occ-start-${key}-day`).fill("12"); await page.locator(`#occ-start-${key}-month`).selectOption("3"); await page.locator(`#occ-start-${key}-year`).fill("2026");
  await page.locator(`#occ-start-${key}-hour`).fill("15"); await page.locator(`#occ-start-${key}-minute`).focus(); await page.locator(`#occ-end-${key}-day`).focus(); await sleep(300);
  log("fixed start 12 Mar 15:00 -> end", await end());
}
log(vp, "ended chips", await page.locator("ol[aria-label] > li").first().locator("text=Ended").count(), "opacity", await page.evaluate(() => [...document.querySelectorAll("ol[aria-label] > li")].map((l) => getComputedStyle(l).opacity + "/" + getComputedStyle(l).backgroundColor)));
log(vp, "axe", await ax(page));
await shot(page, `event-${vp}`, true);
await browser.close();
}
