// P1 probe 1: offline banner, picker, switcher, header. Usage: node m1.mjs <before|after>
import { createRequire } from "node:module";
import { open, go } from "../../../../tools/session.mjs";
const require = createRequire("C:/Users/mirto/IdeaProjects/iguide/uniche_iguide_frontend/package.json");
const tag = process.argv[2] ?? "after";
const P = "6958c18f-60d2-4140-a524-5a43f8a2f6b5";
const OUT = `ux-audit/round-3/implementation/P1/${tag}/`;
const res = {};
const inter = (a, b) => !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

// ---- A. offline at 1440 and 768
for (const vp of ["1440", "768"]) {
  const { browser, context, page } = await open("admin", { viewport: vp });
  await go(page, `/projects/${P}/pois`);
  await page.waitForSelector("main tbody tr", { timeout: 8000 }).catch(async () => { console.log("NOROWS", page.url(), (await page.evaluate(() => document.body.innerText)).slice(0, 300)); await page.screenshot({ path: OUT + "debug.png" }); });
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const rect = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
    const banner = [...document.querySelectorAll("[role=alert]")].find((e) => /offline/i.test(e.textContent ?? ""));
    const acts = [...document.querySelectorAll("main h1 ~ * button, main [data-variant]")].filter((e) => e.offsetParent).slice(0, 8);
    const head = document.querySelector("main button[data-variant=primary]");
    const hdr = document.querySelector("header");
    return {
      banner: banner ? rect(banner) : null,
      bannerPosition: banner ? getComputedStyle(banner).position : null,
      header: rect(hdr),
      actions: acts.map((e) => ({ label: e.textContent.trim().slice(0, 28), r: rect(e), ariaDisabled: e.getAttribute("aria-disabled"), describedby: e.getAttribute("aria-describedby"), title: e.title })),
      primary: head ? { label: head.textContent.trim(), ariaDisabled: head.getAttribute("aria-disabled"), disabledAttr: head.disabled, describedText: document.getElementById(head.getAttribute("aria-describedby") ?? "x")?.textContent ?? null } : null,
      mainTop: rect(document.querySelector("main")).y,
    };
  });
  const bannerBox = m.banner;
  m.overlaps = m.actions.filter((a) => bannerBox && inter(bannerBox, a.r)).map((a) => a.label);
  m.overlapsHeader = bannerBox ? inter(bannerBox, m.header) : null;
  // click the primary and read the live region
  const before = await page.evaluate(() => [...document.querySelectorAll("[aria-live=polite]")].map((e) => e.textContent).join("|") ?? "");
  await page.locator("main button[data-variant=primary]").first().click({ force: true, timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(400);
  m.dialogOpened = await page.locator("[role=dialog]").count();
  m.announced = await page.evaluate(() => [...document.querySelectorAll("[aria-live=polite]")].map((e) => e.textContent).join("|") ?? "");
  await page.screenshot({ path: OUT + `offline-pois-${vp}.png` });
  // editor head
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  res["offline" + vp] = m;
  await browser.close();
}

// ---- B. picker settles
{
  const { browser, page } = await open("admin", { viewport: "1440" });
  const loads = [];
  for (let i = 0; i < 3; i++) {
    await page.goto("about:blank");
    await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
    await page.goto("http://localhost:5173/");
    const samples = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 5000) {
      samples.push(await page.evaluate(() => {
        const t = document.querySelector("main")?.innerText ?? "";
        return { t: Date.now(), notChecked: (t.match(/Setup not checked/g) ?? []).length, checking: (t.match(/Checking setup/g) ?? []).length, needs: (t.match(/Needs setup \(\d+\+?\)/g) ?? []).join("|"), orgs: (t.match(/^.*\(\d+\)$/gm) ?? []).join("|"), rows: document.querySelectorAll("[data-project-row]").length };
      }));
      await page.waitForTimeout(100);
    }
    const distinctNeeds = [...new Set(samples.map((s) => s.needs))];
    const distinctOrgs = [...new Set(samples.map((s) => s.orgs))];
    loads.push({
      maxNotChecked: Math.max(...samples.map((s) => s.notChecked)), maxChecking: Math.max(...samples.map((s) => s.checking)),
      needsSeen: distinctNeeds, orgCountStates: distinctOrgs.length, finalRows: samples.at(-1).rows, finalNeeds: samples.at(-1).needs,
      cls: +(await page.evaluate(() => window.__cls)).toFixed(4),
    });
    if (i === 0) await page.screenshot({ path: OUT + "home-list-1440.png", fullPage: false });
  }
  res.picker = loads;
  await browser.close();
}

// ---- C. switcher + header
{
  const { browser, context, page } = await open("admin", { viewport: "1440", touch: false });
  await go(page, `/projects/${P}`);
  await page.waitForSelector("main h1");
  const AxeBuilder = require("@axe-core/playwright").default;
  const sw = page.getByRole("button", { name: /switch project/i });
  res.header = await page.evaluate(() => {
    const a = document.querySelector("header a[href='/']"); const img = a?.querySelector("img"); const r = a?.getBoundingClientRect(); const ir = img?.getBoundingClientRect();
    const after = a ? getComputedStyle(a, "::after") : null;
    return { logoImgH: ir?.height, linkBox: r && { w: r.width, h: r.height }, afterW: after?.width, afterH: after?.height, nav: document.querySelector("#workspace-nav")?.getAttribute("aria-label"), chip: document.querySelector("header button [class*=chip], header button .ui-chip")?.textContent?.trim() };
  });
  res.header.dashboardChip = await page.evaluate(() => [...document.querySelectorAll("main .ui-chip")].map((e) => e.textContent.trim()).find((t) => /Visitor app|App:/.test(t)));
  res.switcher = { closedAriaControls: await sw.getAttribute("aria-controls") };
  await sw.click(); await page.waitForTimeout(1500);
  res.switcher.openAriaControls = await sw.getAttribute("aria-controls");
  res.switcher.contentId = await page.evaluate(() => document.querySelector("[role=dialog][aria-label='Switch project']")?.id ?? null);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  res.switcher.axe = r.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
  await page.screenshot({ path: OUT + "switcher-open-1440.png" });
  await page.keyboard.press("Escape");
  const r2 = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  res.switcher.axeClosed = r2.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
  await browser.close();
}
console.log(JSON.stringify(res, null, 1));
