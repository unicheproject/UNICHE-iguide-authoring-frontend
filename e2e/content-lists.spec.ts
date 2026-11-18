import { expect, test } from "@playwright/test";
import { api, newProject } from "./support/api.ts";
import { expectGradientTextContrast, expectNoAxeViolations, expectSolidFillContrast } from "./support/a11y.ts";

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
    // D-072: the primary action is a solid fill now; its text and the field borders are checked as strictly.
    await expectSolidFillContrast(page, `${list.path} list, empty`);

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
for (const list of LISTS.filter((l) => !["maps", "places", "pois", "routes"].includes(l.path))) {
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

/*
 * Places, Points of Interest and Routes use the list scaffold (D-076): the filters are always visible in the sticky
 * toolbar and live in the URL. The toolbar only exists once the kind has a row, so each list gets one through the API;
 * choosing the Draft segment writes `status=DRAFT` to the address, shows "Clear filters", and clearing removes it.
 */
const SCAFFOLD_LISTS: { path: string; body: Record<string, unknown> }[] = [
  { path: "places", body: { title: "Scaffold place", slug: "scaffold-place", type: "AREA", setting: "OUTDOOR", parentPlaceId: null } },
  { path: "pois", body: { title: "Scaffold point", slug: "scaffold-point", placeId: null, code: null } },
  { path: "routes", body: { title: "Scaffold route", slug: "scaffold-route", type: "OUTDOOR" } },
];
for (const list of SCAFFOLD_LISTS) {
  test(`${list.path}: scaffold toolbar filters from the keyboard and keeps them in the URL`, async ({ page }) => {
    const project = await newProject(`scaffold-${list.path}`);
    await api("POST", `/projects/${project.id}/${list.path}`, list.body, 201);
    await page.goto(`/projects/${project.id}/${list.path}`);
    const search = page.getByRole("search", { name: "Search and filter" });
    await expect(search).toBeVisible();
    await expectNoAxeViolations(page, `${list.path} list, one row`);

    await search.getByRole("radio", { name: /^Draft/ }).focus();
    await page.keyboard.press("Space");
    await expect(page).toHaveURL(/status=DRAFT/);
    const clear = search.getByRole("button", { name: "Clear filters" });
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(page).not.toHaveURL(/status=/);

    // Every row has a menu button named for it, reached by Tab after the row's link.
    await expect(page.getByRole("button", { name: /^Actions for Scaffold/ })).toBeVisible();
  });
}

/*
 * Round 2 (D-091): "/" jumps to the search of a list; Esc in a create dialog with typed text asks before it discards,
 * "Keep editing" keeps the text, "Discard" closes; one pass of validation names every missing field in form order.
 */
test("pois: '/' focuses the search and Esc in the create dialog asks before discarding typed text", async ({ page }) => {
  const project = await newProject("round2-core");
  await api("POST", `/projects/${project.id}/pois`, { title: "Round two point", slug: "round-two-point", placeId: null, code: null }, 201);
  await page.goto(`/projects/${project.id}/pois`);
  const search = page.getByRole("main").getByRole("searchbox");
  await expect(search).toBeVisible();
  await page.getByRole("heading", { level: 1 }).focus();
  await page.keyboard.press("/");
  await expect(search).toBeFocused();

  const create = page.getByRole("button", { name: /^New point of interest$/ }).first();
  await create.click();
  const dialog = page.getByRole("dialog", { name: /^New point of interest$/ });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox").first().fill("Typed but not created");
  await page.keyboard.press("Escape");
  const ask = page.getByRole("dialog", { name: "Discard what you typed?" });
  await expect(ask).toBeVisible();
  await ask.getByRole("button", { name: "Keep editing" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("textbox").first()).toHaveValue("Typed but not created");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "Discard what you typed?" }).getByRole("button", { name: "Discard" }).click();
  await expect(dialog).toBeHidden();
});

/*
 * D-091 paging: the loader reads every page of the API, whatever the table shows per page. The first answer is made to
 * claim a second page; the list must ask for it (`page=1`) before it renders.
 */
test("pois: the loader asks for page 2 when the platform reports totalPages 2", async ({ page }) => {
  const project = await newProject("round2-paging");
  await api("POST", `/projects/${project.id}/pois`, { title: "Paging point", slug: "paging-point", placeId: null, code: null }, 201);
  const requested: string[] = [];
  await page.route(new RegExp(`/projects/${project.id}/pois\\?`), async (route) => {
    const url = route.request().url();
    requested.push(new URL(url).searchParams.get("page") ?? "");
    const response = await route.fetch();
    const body = (await response.json()) as { totalPages?: number };
    if (requested.length === 1) body.totalPages = 2;
    await route.fulfill({ response, json: body });
  });
  await page.goto(`/projects/${project.id}/pois`);
  await expect(page.getByRole("link", { name: "Paging point" })).toBeVisible();
  expect(requested).toEqual(["0", "1"]);
});

/*
 * Round 3 (D-110): the Filters popover of a scaffold list has an accessible name, a button whose name starts with its
 * visible text ("Filters 1"), a visible Done that closes it and gives focus back to the button.
 */
test("pois: the Filters popover is named, has Done, and the button name contains its visible text", async ({ page }) => {
  const project = await newProject("filters-popover");
  await api("POST", `/projects/${project.id}/pois`, { title: "Popover point", slug: "popover-point", placeId: null, code: null }, 201);
  await page.goto(`/projects/${project.id}/pois?pending=1`);
  const filters = page.getByRole("button", { name: /^Filters 1$/ });
  await expect(filters).toBeVisible();
  await expectNoAxeViolations(page, "pois list, a filter on");
  await filters.click();
  const popover = page.getByRole("dialog", { name: "Filters and sort" });
  await expect(popover).toBeVisible();
  await popover.getByRole("button", { name: "Done" }).click();
  await expect(popover).toBeHidden();
  await expect(filters).toBeFocused();
});
