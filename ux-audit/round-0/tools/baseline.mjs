// Round-0 baseline screenshots. Run with Windows Node:
//   cmd.exe /c "cd /d C:\Users\mirto\IdeaProjects\iguide\uniche_iguide_frontend && node ux-audit\round-0\tools\baseline.mjs [only-substring]"
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { open, go, CMS, API, VIEWPORTS } from "../../tools/session.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "shots");
const seed = JSON.parse(readFileSync(join(here, "..", "..", "tools", "seed.json"), "utf8"));
const only = process.argv[2];
const P = seed.projects.populated.id, E = seed.projects.empty.id;
const pick = (list, key) => list.find((x) => x.key === key)?.id;
const poi = (k) => pick(seed.pois, k), plc = (k) => pick(seed.places, k), rt = (k) => pick(seed.routes, k);
const gd = (k) => pick(seed.guides, k), ev = (k) => pick(seed.events, k), cat = (k) => pick(seed.categories, k), as = (k) => pick(seed.assets, k);
const base = (id) => `/projects/${id}`;
const rows = [];
const failed = [];

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  for (let i = 0; i < 40; i++) {
    const n = await page.locator(".animate-skeleton, [aria-busy='true']").count();
    if (!n) break;
    await page.waitForTimeout(500);
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(700);
}
async function shot(page, screen, state, vp, how) {
  const file = `${screen}__${state}__${vp}.png`;
  if (only && !file.includes(only)) return;
  await settle(page);
  // The app scrolls inside a container, so grow the viewport to the tallest scroller before a full-page shot.
  const orig = page.viewportSize();
  const extra = await page.evaluate(() => {
    let max = 0;
    for (const el of document.querySelectorAll("*")) {
      const o = getComputedStyle(el).overflowY;
      if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight + 4) max = Math.max(max, el.scrollHeight - el.clientHeight);
    }
    return max;
  });
  if (extra > 0) { await page.setViewportSize({ width: orig.width, height: Math.min(orig.height + extra, 7000) }); await page.waitForTimeout(500); }
  await page.screenshot({ path: join(OUT, file), fullPage: true });
  if (extra > 0) await page.setViewportSize(orig);
  rows.push({ screen, state, vp, file, how });
  console.log(file);
}
async function step(name, fn) {
  try { await fn(); } catch (e) { failed.push(`${name}: ${String(e.message).split("\n")[0]}`); console.log("FAIL", name, String(e.message).split("\n")[0]); }
}
const esc = async (page) => { await page.keyboard.press("Escape"); await page.waitForTimeout(300); };
const click = (page, name, opts = {}) => page.getByRole("button", { name, ...opts }).first().click({ timeout: 8000 });

const lists = [
  ["places", "Places", "New place"],
  ["pois", "Points of Interest", "New point of interest"],
  ["routes", "Routes", "New route"],
  ["guides", "Guides", "New guide"],
  ["events", "Events", "New event"],
  ["categories", "Categories", "New category"],
];

async function run(vp) {
  const full = vp === "1440";
  const { browser, context, page } = await open("curator", { viewport: vp });
  const goto = async (p) => { await go(page, p); };
  const VP = vp;

  // ---- Dashboard
  await step("dashboard populated " + vp, async () => { await goto(base(P)); await shot(page, "dashboard", "populated", VP, `${base(P)}`); });
  if (full) await step("dashboard empty", async () => { await goto(base(E)); await shot(page, "dashboard", "empty-project", VP, `${base(E)} (Empty Project)`); });

  // ---- Lists
  for (const [slug, , newLabel] of lists) {
    if (!full && slug !== "pois") continue;
    await step(`${slug} populated ${vp}`, async () => { await goto(`${base(P)}/${slug}`); await shot(page, `${slug}-list`, "populated", VP, `${base(P)}/${slug}`); });
    if (!full) continue;
    await step(`${slug} filtered-empty`, async () => {
      const input = page.locator("input[type=search], input[placeholder*='earch' i]").first();
      await input.fill("zzzz"); await page.waitForTimeout(1200);
      await shot(page, `${slug}-list`, "filtered-empty", VP, `${base(P)}/${slug}, type "zzzz" in the search box`);
    });
    await step(`${slug} empty project`, async () => { await goto(`${base(E)}/${slug}`); await shot(page, `${slug}-list`, "empty-project", VP, `${base(E)}/${slug} (Empty Project)`); });
    await step(`${slug} create dialog`, async () => {
      await goto(`${base(P)}/${slug}`); await click(page, new RegExp(`^${newLabel}$`, "i")); await page.waitForTimeout(600);
      await shot(page, `${slug}-list`, "create-dialog", VP, `${base(P)}/${slug}, click "${newLabel}"`); await esc(page);
    });
  }
  // POI list extra: pending-filter / dense view not needed.

  // ---- Editors
  const editors = [
    ["poi-editor", "draft", "pois", poi("horsemen")], ["poi-editor", "active", "pois", poi("pediment")], ["poi-editor", "pending-working-copy", "pois", poi("frieze")],
    ["place-editor", "draft", "places", plc("slopes")], ["place-editor", "active", "places", plc("museum")],
    ["route-editor", "draft", "routes", rt("agora")], ["route-editor", "active", "routes", rt("acro")], ["route-editor", "pending-working-copy", "routes", rt("family")],
    ["guide-editor", "draft", "guides", gd("agora")], ["guide-editor", "active", "guides", gd("caryatids")], ["guide-editor", "pending-working-copy", "guides", gd("parthenon")],
    ["event-editor", "draft", "events", ev("lectures")], ["event-editor", "active", "events", ev("fullmoon")],
    ["category-editor", "active", "categories", cat("monuments")], ["category-editor", "active-subcategory", "categories", cat("food")],
  ];
  for (const [screen, state, slug, id] of editors) {
    if (!full && !(screen === "poi-editor" && state === "active")) continue;
    await step(`${screen} ${state} ${vp}`, async () => { await goto(`${base(P)}/${slug}/${id}`); await shot(page, screen, state, VP, `${base(P)}/${slug}/${id}`); });
  }
  if (full) {
    await step("poi preview in app", async () => {
      await goto(`${base(P)}/pois/${poi("pediment")}`); await click(page, /Preview in app/); await page.waitForTimeout(1200);
      await shot(page, "poi-editor", "preview-in-app-panel", VP, `${base(P)}/pois/${poi("pediment")}, click "Preview in app"`); await esc(page);
    });
    await step("poi asset picker", async () => {
      await goto(`${base(P)}/pois/${poi("horsemen")}`); await click(page, /Choose asset|^Choose$/); await page.waitForTimeout(1500);
      await shot(page, "asset-picker", "open-from-poi-editor", VP, `${base(P)}/pois/${poi("horsemen")}, in the media slots click "Choose asset"`); await esc(page);
    });
  }

  // ---- Maps and floor plans
  await step("maps list", async () => { if (!full) return; await goto(`${base(P)}/maps`); await shot(page, "maps-list", "populated", VP, `${base(P)}/maps`); });
  await step("map editor " + vp, async () => { const id = seed.maps[0].id; await goto(`${base(P)}/maps/${id}`); await page.waitForTimeout(2500); await shot(page, "map-editor", "populated", VP, `${base(P)}/maps/${id}`); });
  if (full) {
    await step("maps empty", async () => { await goto(`${base(E)}/maps`); await shot(page, "maps-list", "empty-project", VP, `${base(E)}/maps (Empty Project)`); });
    await step("new map dialog", async () => { await goto(`${base(P)}/maps`); await click(page, /^New map$/); await page.waitForTimeout(600); await shot(page, "maps-list", "new-map-dialog", VP, `${base(P)}/maps, click "New map"`); await esc(page); });
    await step("floor plans list", async () => { await goto(`${base(P)}/floor-plans`); await shot(page, "floor-plans-list", "populated", VP, `${base(P)}/floor-plans (or Maps page, tab "Floor plans")`); });
    await step("floor plans empty", async () => { await goto(`${base(E)}/floor-plans`); await shot(page, "floor-plans-list", "empty-project", VP, `${base(E)}/floor-plans (Empty Project)`); });
    await step("new floor plan dialog", async () => { await goto(`${base(P)}/floor-plans`); await click(page, /^New floor plan$/); await page.waitForTimeout(600); await shot(page, "floor-plans-list", "new-floor-plan-dialog", VP, `${base(P)}/floor-plans, click "New floor plan"`); await esc(page); });
    await step("floor plan editor", async () => { const id = seed.floorPlans[0].id; await goto(`${base(P)}/floor-plans/${id}`); await page.waitForTimeout(1500); await shot(page, "floor-plan-editor", "populated", VP, `${base(P)}/floor-plans/${id}`); });
  }

  // ---- Media
  await step("media grid " + vp, async () => { await goto(`${base(P)}/media`); await shot(page, "media-library", "grid", VP, `${base(P)}/media`); });
  if (full) {
    await step("media list", async () => { await goto(`${base(P)}/media`); await click(page, /^List$/); await page.waitForTimeout(800); await shot(page, "media-library", "list", VP, `${base(P)}/media, click "List" in the View toggle`); });
    await step("media filtered-empty", async () => { await goto(`${base(P)}/media`); await page.locator("input[type=search], input[placeholder*='earch' i]").first().fill("zzzz"); await page.waitForTimeout(1200); await shot(page, "media-library", "filtered-empty", VP, `${base(P)}/media, type "zzzz" in the search box`); });
    await step("media empty", async () => { await goto(`${base(E)}/media`); await shot(page, "media-library", "empty-project", VP, `${base(E)}/media (Empty Project)`); });
    await step("upload dialog", async () => { await goto(`${base(P)}/media`); await click(page, /^Upload$/); await page.waitForTimeout(600); await shot(page, "media-library", "upload-dialog", VP, `${base(P)}/media, click "Upload"`); await esc(page); });
    for (const [state, key] of [["image", "a_parthenon_dawn"], ["audio", "au_frieze"], ["pdf", "d_map"]])
      await step("asset " + state, async () => { await goto(`${base(P)}/media/${as(key)}`); await shot(page, "asset-editor", state, VP, `${base(P)}/media/${as(key)} (or click the asset in the library)`); });
  }

  // ---- Preview
  for (const s of ["WEB", "MOBILE", "KIOSK"]) {
    if (!full && s !== "MOBILE") continue;
    await step(`preview ${s} ${vp}`, async () => {
      await goto(`${base(P)}/preview`);
      await page.getByRole("group", { name: "Surface" }).getByRole("button", { name: new RegExp(`^${s}$`, "i") }).click();
      await page.waitForTimeout(1500);
      await shot(page, "preview", s.toLowerCase(), VP, `${base(P)}/preview, choose surface ${s}`);
    });
  }
  if (full) {
    await step("app-preview bare", async () => {
      for (const s of ["MOBILE", "WEB", "KIOSK"]) {
        await goto(`${base(P)}/app-preview?surface=${s}&lang=en&mode=WORKING`); await page.waitForTimeout(1500);
        await shot(page, "app-preview", s.toLowerCase(), VP, `${base(P)}/app-preview?surface=${s}&lang=en&mode=WORKING (Preview page, "Open in new tab")`);
      }
    });
    await step("preview empty", async () => { await goto(`${base(E)}/preview`); await shot(page, "preview", "empty-project", VP, `${base(E)}/preview (Empty Project)`); });
  }

  // ---- Out of scope renders
  if (full) {
    for (const [name, path] of [["overview", "overview"], ["app-settings", "app-settings"], ["languages", "languages"], ["surfaces", "surfaces"], ["features", "features"], ["pages", "pages"], ["navigation", "navigation"], ["translations", "translations"], ["launch", "launch"], ["audit-log", "audit-log"]])
      await step("oos " + name, async () => { await goto(`${base(P)}/${path}`); await shot(page, `oos__${name}`, "render-check", VP, `${base(P)}/${path}`); });
  }

  // ---- Chrome: switcher, offline, forced errors
  if (full) {
    await step("switcher", async () => {
      await goto(base(P)); await page.locator("button[aria-controls='project-switcher-menu']").click(); await page.waitForTimeout(1200);
      await shot(page, "header", "project-switcher-open", VP, `${base(P)}, click the project name in the header`); await esc(page);
    });
    await step("offline", async () => {
      await goto(base(P)); await context.setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event("offline")));
      await page.getByRole("link").first().click({ timeout: 1000 }).catch(() => {});
      await page.reload({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(1500);
      // reload offline would show a browser error page; reopen state through an in-app request instead
      await context.setOffline(false);
      await goto(base(P)); await context.setOffline(true);
      await page.getByRole("link", { name: /Points of Interest/ }).first().click().catch(() => {});
      await page.waitForTimeout(2500);
      await shot(page, "chrome", "offline-banner", VP, `${base(P)}, switch network offline (DevTools), click a nav item`);
      await context.setOffline(false);
    });
    const proj = new RegExp(`${API.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}/projects/${P}(\\?.*)?$`);
    const prob = (status, title) => ({ status, contentType: "application/problem+json", body: JSON.stringify({ type: "about:blank", title, status, detail: title, code: String(status) }) });
    for (const [state, status, title, rx] of [["403-access-denied", 403, "Forbidden", proj], ["404-not-found", 404, "Project not found", proj], ["503-platform-unreachable", 503, "Service unavailable", proj]]) {
      await step("error " + state, async () => {
        await page.route(rx, (r) => r.request().method() === "GET" ? r.fulfill(prob(status, title)) : r.continue());
        await goto(base(P)); await page.waitForTimeout(1000);
        await shot(page, "error", state, VP, `${base(P)} with GET /projects/{id} answering ${status} (page.route)`);
        await page.unroute(rx);
      });
    }
    await step("error 503 on content API", async () => {
      const rx = new RegExp(`${API.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}/projects/${P}/pois`);
      await page.route(rx, (r) => r.fulfill(prob(503, "Service unavailable")));
      await goto(`${base(P)}/pois`); await page.waitForTimeout(1500);
      await shot(page, "error", "503-on-poi-list", VP, `${base(P)}/pois with the POI list request answering 503 (page.route)`);
      await page.unroute(rx);
    });
  }
  await browser.close();
}

// ---- Sign-in (fresh context) and Create Project (admin)
async function signedOut() {
  const { browser } = await open("curator", { viewport: "1440" });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await step("sign-in", async () => {
    await page.goto(CMS + "/"); await settle(page);
    await shot(page, "sign-in", "signed-out", "1440", `${CMS}/ in a private window with no session`);
  });
  await browser.close();
}
async function createProject() {
  const { browser, page } = await open("admin", { viewport: "1440" });
  await step("create project", async () => {
    await go(page, "/projects/new"); await page.waitForTimeout(1500);
    await shot(page, "create-project", "step1-empty", "1440", "/projects/new (admin account)");
    await page.locator("#project-name").fill("UX Baseline Sample Project").catch(() => {});
    await shot(page, "create-project", "step1-filled", "1440", "/projects/new, type a name (not submitted)");
    // Steps 2 and 3 need a created Project; the POST is answered locally so nothing is created.
    await page.route(/\/organizations\/[^/]+\/projects$/, (r) => r.request().method() === "POST"
      ? r.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "00000000-0000-4000-8000-000000000000", organizationId: "00000000-0000-4000-8000-000000000001", name: "UX Baseline Sample Project", slug: "ux-baseline-sample", status: "ACTIVE", localDescription: null, initialized: false }) })
      : r.continue());
    await page.getByRole("button", { name: "Create Project" }).click();
    await page.waitForTimeout(2000);
    await shot(page, "create-project", "step2-template-style-languages-surfaces", "1440", "/projects/new, fill name, click \"Create Project\" (baseline used a stubbed response; step 2 unlocks)");
    await page.getByRole("button", { name: /^Continue$/ }).click();
    await page.waitForTimeout(800);
    await shot(page, "create-project", "step3-summary-initialize", "1440", "as step 2, then click \"Continue\" under Style; step 3 shows the summary and \"Initialize\" (not clicked)");
  });
  await browser.close();
}

await signedOut();
await createProject();
for (const vp of ["1440", "1024", "768"]) await run(vp);

writeFileSync(join(OUT, "_rows.json"), JSON.stringify(rows, null, 1));
writeFileSync(join(OUT, "_failed.txt"), failed.join("\n"));
console.log(`done: ${rows.length} shots, ${failed.length} failures`);
