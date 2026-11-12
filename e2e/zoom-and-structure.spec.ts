import { expect, test, type Page } from "@playwright/test";
import { api, newProject, upload, wav } from "./support/api.ts";

/*
 * The automatable half of to-do A43 (`14` §1 WCAG 2.1 AA, §4): every Content list and editor
 *  - at 200% zoom (half the CSS width, 1.4.4) and at 320 CSS pixels (1.4.10 reflow) keeps its title and main
 *    action reachable without scrolling the page sideways; tables may scroll inside their own box;
 *  - has one main landmark, the workspace navigation, one level-1 heading, and no skipped heading level, which is
 *    how a screen reader user moves through it.
 * Listening with NVDA stays a manual check.
 */
let projectId = "";
const screens: { name: string; path: string; action: RegExp }[] = [];

test.beforeAll(async () => {
  projectId = (await newProject("zoom")).id;
  const base = `/projects/${projectId}`;
  const place = await api<{ id: string }>("POST", `${base}/places`, { title: "Kymi", type: "SITE" });
  const poi = await api<{ id: string }>("POST", `${base}/pois`, { title: "Kouros" });
  const route = await api<{ id: string }>("POST", `${base}/routes`, { title: "Harbour walk", type: "OUTDOOR" });
  const guide = await api<{ id: string }>("POST", `${base}/guides`, { title: "Highlights" });
  const event = await api<{ id: string }>("POST", `${base}/events`, { title: "Curator talk" });
  const category = await api<{ id: string }>("POST", `${base}/categories`, { name: "Sculpture", scope: "POI" });
  const map = await api<{ id: string }>("POST", `${base}/maps`, {
    internalName: "Kymi coast",
    initialLatitude: 38.63,
    initialLongitude: 24.1,
    initialZoom: 13,
  });
  const asset = await upload(projectId, "narration.wav", "audio/wav", wav(2));
  const lists: [string, RegExp][] = [
    ["places", /^New place$/],
    ["pois", /^New point of interest$/],
    ["routes", /^New route$/],
    ["guides", /^New guide$/],
    ["events", /^New event$/],
    ["categories", /^New category$/],
    ["maps", /^New map$/],
    ["media", /^Upload$/],
  ];
  for (const [path, action] of lists) screens.push({ name: `${path} list`, path, action });
  screens.push({ name: "navigation", path: "navigation", action: /^\+ Link$/ });
  const editors: [string, string][] = [
    ["places", place.id],
    ["pois", poi.id],
    ["routes", route.id],
    ["guides", guide.id],
    ["events", event.id],
    ["categories", category.id],
    ["maps", map.id],
    ["media", asset.id],
  ];
  for (const [path, id] of editors) screens.push({ name: `${path} editor`, path: `${path}/${id}`, action: /^Save$/ });
});

/** The screen has mounted (its title shows) and finished loading. */
async function settle(page: Page) {
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
}

/** How far the page scrolls sideways, and the innermost element that sticks out the most, to say where to look. */
async function horizontalOverflow(page: Page): Promise<{ by: number; culprit: string }> {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    let culprit = "";
    let widest = limit;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const right = el.getBoundingClientRect().right;
      if (right > widest + 1 && !Array.from(el.children).some((c) => c.getBoundingClientRect().right >= right)) {
        widest = right;
        culprit = `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 6).join(".")} "${el.innerText.trim().slice(0, 30)}"`;
      }
    }
    return { by: document.documentElement.scrollWidth - limit, culprit };
  });
}

for (const [label, size] of [
  ["200% zoom", { width: 700, height: 450 }],
  ["320px reflow", { width: 320, height: 256 }],
] as const) {
  test(`Content screens at ${label} keep their title and main action without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize(size);
    const problems: string[] = [];
    for (const screen of screens) {
      await page.goto(`/projects/${projectId}/${screen.path}`);
      await settle(page);
      const overflow = await horizontalOverflow(page);
      if (overflow.by > 1) problems.push(`${screen.name}: the page scrolls ${overflow.by}px sideways (${overflow.culprit})`);
      const action = page.getByRole("button", { name: screen.action }).first();
      if (!(await action.count())) {
        problems.push(`${screen.name}: no "${screen.action.source}" button`);
        continue;
      }
      await action.scrollIntoViewIfNeeded();
      const box = await action.boundingBox();
      if (!box || box.x < 0 || box.x + box.width > size.width + 1) problems.push(`${screen.name}: "${screen.action.source}" is cut off`);
    }
    expect(problems).toEqual([]);
  });
}

test("Content screens have landmarks and an unbroken heading outline", async ({ page }) => {
  const problems: string[] = [];
  for (const screen of screens) {
    await page.goto(`/projects/${projectId}/${screen.path}`);
    await settle(page);
    const outline = await page.evaluate(() => {
      // The stand-in visitor app of a preview has its own outline, as the iframe of `12` §3 will.
      const visible = (el: Element) =>
        !el.closest("[data-preview-frame]") &&
        ((el as HTMLElement).offsetParent !== null || getComputedStyle(el).position === "fixed");
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role=heading]"))
        .filter(visible)
        .map((el) => ({
          level: Number(el.getAttribute("aria-level") ?? el.tagName.slice(1)),
          text: (el.textContent ?? "").trim().slice(0, 40),
        }));
      return {
        headings,
        main: document.querySelectorAll("main, [role=main]").length,
        navigation: document.querySelectorAll("nav, [role=navigation]").length,
      };
    });
    if (outline.main !== 1) problems.push(`${screen.name}: ${outline.main} main landmarks`);
    if (outline.navigation < 1) problems.push(`${screen.name}: no navigation landmark`);
    const ones = outline.headings.filter((h) => h.level === 1).length;
    if (ones !== 1) problems.push(`${screen.name}: ${ones} level-1 headings`);
    outline.headings.forEach((h, i) => {
      const previous = i === 0 ? 0 : outline.headings[i - 1].level;
      if (h.level > previous + 1) problems.push(`${screen.name}: "${h.text}" is h${h.level} after h${previous}`);
    });
  }
  expect(problems).toEqual([]);
});
