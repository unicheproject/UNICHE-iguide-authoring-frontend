import { expect, test, type Page } from "@playwright/test";
import { newProject } from "./support/api.ts";
import { expectNoAxeViolations } from "./support/a11y.ts";

/*
 * The screens outside the Content lists and editors (`12` §3: the Project picker, Visitor app Overview, Languages,
 * Surfaces, Translations, Preview) pass axe once loaded, and every screen's loading placeholder passes axe while
 * the backend has not answered yet (`14` §4; D-051: a labelled placeholder needs a role).
 */
let projectId = "";

test.beforeAll(async () => {
  projectId = (await newProject("screens")).id;
});

const SCREENS = ["overview", "languages", "surfaces", "translations", "preview", "navigation"];

test("the Project picker passes axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Museum of Cycladic Art/).first()).toBeVisible();
  await expectNoAxeViolations(page, "Project picker");
});

for (const screen of SCREENS) {
  test(`${screen} passes axe once loaded`, async ({ page }) => {
    await page.goto(`/projects/${projectId}/${screen}`);
    // The first level-1 heading is the screen's; Preview also shows the stand-in app's own page title.
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expectNoAxeViolations(page, screen);
  });
}

/** Holds back every backend read until the test releases it, so the loading state stays on screen. */
async function holdReads(page: Page): Promise<() => void> {
  let release: () => void = () => {};
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(/\/iguide\/api\/v1\/projects\/[^/]+\/(?!working-copy).+/, async (route) => {
    if (route.request().method() === "GET") await released;
    await route.continue();
  });
  return release;
}

const LOADING = ["places", "pois", "routes", "guides", "events", "categories", "maps", "floor-plans", "media", ...SCREENS];

for (const screen of LOADING) {
  test(`${screen} passes axe while it loads`, async ({ page }) => {
    const release = await holdReads(page);
    await page.goto(`/projects/${projectId}/${screen}`);
    await expect(page.locator("[aria-busy=true]").first()).toBeVisible();
    await expectNoAxeViolations(page, `${screen} while loading`, { loading: true });
    release();
    await expect(page.locator("[aria-busy=true]")).toHaveCount(0);
  });
}
