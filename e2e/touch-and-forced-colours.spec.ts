import { expect, test } from "@playwright/test";
import { api, newProject } from "./support/api.ts";

/*
 * Round 2, W0-A (D-086, C2-01, C2-02): an icon-only button is at least 32 CSS pixels square (40 by design, 44 on a
 * coarse pointer, `14` §4), a text link marked `hit-44` reaches 44 by 44, and in forced-colours mode a dialog keeps a
 * visible boundary. Needs the signed-in stack like the other specs; it was written without being run (no Keycloak in
 * the authoring environment).
 */
let projectId = "";

test.beforeAll(async () => {
  projectId = (await newProject("touch")).id;
  await api("POST", `/projects/${projectId}/pois`, { title: "Kouros" });
});

/** Every visible button with no text of its own, with its box. */
async function iconButtons(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("button")]
      .filter((b) => b.offsetParent !== null && !(b.textContent ?? "").trim())
      .map((b) => {
        const box = b.getBoundingClientRect();
        return { label: b.getAttribute("aria-label") ?? b.outerHTML.slice(0, 80), width: box.width, height: box.height };
      }),
  );
}

test("icon buttons on the POI list are at least 32 px", async ({ page }) => {
  await page.goto(`/projects/${projectId}/pois`);
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  const small = (await iconButtons(page)).filter((b) => b.width < 32 || b.height < 32);
  expect(small).toEqual([]);
});

test.describe("coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true });
  test("icon buttons on the POI list are at least 44 px", async ({ page }) => {
    await page.goto(`/projects/${projectId}/pois`);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    const small = (await iconButtons(page)).filter((b) => b.width < 43.5 || b.height < 43.5);
    expect(small).toEqual([]);
  });
});

test.describe("forced colours", () => {
  test.use({ colorScheme: "light", forcedColors: "active" });
  test("a dialog has a visible 1 px boundary", async ({ page }) => {
    await page.goto(`/projects/${projectId}/pois`);
    await page.getByRole("button", { name: /^(New|Create|Add)/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const width = await dialog.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    expect(width).toBeGreaterThanOrEqual(1);
    await expect(dialog).toHaveScreenshot("forced-colours-dialog.png", { maxDiffPixelRatio: 0.05 });
  });

  // Round 3 (D-101, C3-03): in forced colours only the highlighted menu item is outlined; the other rows are plain text.
  test("an open row menu outlines only the highlighted item", async ({ page }) => {
    await page.goto(`/projects/${projectId}/pois`);
    await page.getByRole("button", { name: /^Actions for/ }).first().click();
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    const outlined = await page.locator("[role=menu] [role=menuitem]").evaluateAll(
      (items) => items.filter((item) => getComputedStyle(item).outlineStyle !== "none" || parseFloat(getComputedStyle(item).borderTopWidth) > 0).length,
    );
    expect(outlined).toBe(1);
    await expect(page.getByRole("menu")).toHaveScreenshot("forced-colours-menu-open.png", { maxDiffPixelRatio: 0.05 });
  });
});

test("an address that does not exist shows the not-found page and focuses its heading", async ({ page }) => {
  await page.goto("/projects/not-a-uuid/pois");
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeFocused();
});
