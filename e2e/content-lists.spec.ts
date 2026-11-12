import { expect, test } from "@playwright/test";
import { newProject } from "./support/api.ts";
import { expectGradientTextContrast, expectNoAxeViolations } from "./support/a11y.ts";

/*
 * Every Content list of `12` §3 in its empty state, in a Project of its own: the page and its create dialog pass
 * axe and the gradient contrast check (D-053), and the dialog works from the keyboard (`14` §4: focus moves into the dialog, Escape closes it, and focus
 * returns to the button that opened it).
 */
const LISTS = [
  { path: "places", heading: /^Places$/, create: /^New place$/ },
  { path: "pois", heading: /^Points of Interest$/i, create: /^New point of interest$/ },
  { path: "routes", heading: /^Routes$/, create: /^New route$/ },
  { path: "guides", heading: /^Guides$/, create: /^New guide$/ },
  { path: "events", heading: /^Events$/, create: /^New event$/ },
  { path: "categories", heading: /^Categories$/, create: /^New category$/ },
  { path: "maps", heading: /^Maps/, create: /^New map$/ },
  { path: "media", heading: /^Media/, create: /^Upload$/ },
];

let projectId = "";

test.beforeAll(async () => {
  projectId = (await newProject("lists")).id;
});

for (const list of LISTS) {
  test(`${list.path}: empty list and create dialog pass axe and work from the keyboard`, async ({ page }) => {
    await page.goto(`/projects/${projectId}/${list.path}`);
    await expect(page.getByRole("heading", { level: 1, name: list.heading })).toBeVisible();
    const create = page.getByRole("button", { name: list.create }).first();
    await expect(create).toBeEnabled();
    await expectNoAxeViolations(page, `${list.path} list, empty`);
    await expectGradientTextContrast(page, `${list.path} list, empty`);

    await create.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate((d) => d.contains(d.ownerDocument.activeElement))).toBe(true);
    await expectNoAxeViolations(page, `${list.path} create dialog`);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(create).toBeFocused();
  });
}

/*
 * The filter menu every Content list shares except Maps (DECISIONS.md D-061): the search stays in the
 * toolbar, the filters open in a popover that takes focus and gives it back on Escape, a chosen filter shows as a
 * removable chip and in the button's count, and removing the chip clears it.
 */
for (const list of LISTS.filter((l) => l.path !== "maps")) {
  test(`${list.path}: filter menu works from the keyboard and shows active filters`, async ({ page }) => {
    await page.goto(`/projects/${projectId}/${list.path}`);
    await expect(page.getByRole("main").getByRole("searchbox")).toBeVisible();
    const filters = page.getByRole("button", { name: /^Filters/ });
    await expect(filters).toHaveText(/^\s*Filters\s*$/);

    await filters.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("dialog", { name: "Filters" });
    await expect(menu).toBeVisible();
    await expect.poll(() => menu.evaluate((d) => d.contains(d.ownerDocument.activeElement))).toBe(true);
    await expectNoAxeViolations(page, `${list.path} filter menu`);

    // The first group is Type on Media and Status elsewhere; ArrowRight moves its choice off "All".
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(filters).toBeFocused();
    await expect(filters).toContainText("1 active");

    const chips = page.getByRole("list", { name: "Active filters" });
    const chip = chips.getByRole("button", { name: /^Remove filter / });
    await expect(chip).toHaveCount(1);
    await chip.click();
    await expect(chips).toBeHidden();
    await expect(filters).toBeFocused();
  });
}
