import { open, go, shot, POP, EMPTY_D, EMPTY_B } from "./lib.mjs";
const kinds = ["places","pois","routes","guides","events","categories"];
const { browser, page } = await open("curator", { viewport: "1440" });
for (const [name, id] of [["emptyD", EMPTY_D], ["emptyB", EMPTY_B]]) for (const k of kinds) {
  await go(page, `/projects/${id}/${k}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForTimeout(1200);
  const t = await page.evaluate(() => ({ title: document.title, main: document.querySelector("main").innerText.replace(/\s+/g, " ").slice(0, 700), btns: [...document.querySelectorAll("main button, main a")].filter((e) => e.getBoundingClientRect().width).map((e) => e.textContent.trim()).filter(Boolean).slice(0, 14) }));
  console.log(name, k, JSON.stringify(t));
  await shot(page, `${k}-list__${name}`, "1440");
}
await browser.close();
