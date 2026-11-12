import { expect, test } from "@playwright/test";
import { api, newProject } from "./support/api.ts";
import { expectNoAxeViolations } from "./support/a11y.ts";

interface Menu {
  context: string;
  items: { id: string; depth: number; itemType: string; targetResourceId: string | null; labels: Record<string, string> }[];
}

/*
 * Visitor app → Navigation (`12` §3 Navigation editor, `03` §13; D-055, backend D-046): a main menu built from the
 * keyboard (a heading, two links moved under it, reordered), a label per language with the target title as the
 * fallback, a footer link, the preview drawing the menu, and a heading removed with what is under it. Every state
 * passes axe.
 */
test("the main menu and the footer links are built from the keyboard and drawn in the preview", async ({ page }) => {
  const project = await newProject("navigation");
  const base = `/projects/${project.id}`;
  const kouros = await api<{ id: string }>("POST", `${base}/pois`, { title: "Kouros" });
  const harbour = await api<{ id: string }>("POST", `${base}/places`, { title: "Harbour", type: "SITE" });
  const menus = () => api<Menu[]>("GET", `${base}/navigations`);

  await page.goto(`${base}/navigation`);
  await expect(page.getByRole("heading", { level: 1, name: "Navigation", exact: true })).toBeVisible();
  await expect(page.getByText(/The main menu is empty/)).toBeVisible();
  await expectNoAxeViolations(page, "Navigation, empty");

  // A heading, then two links.
  await page.getByRole("button", { name: "+ Heading" }).click();
  await page.getByLabel(/Label in Ελληνικά/).fill("Επίσκεψη");
  await expectNoAxeViolations(page, "add heading dialog");
  await page.getByRole("button", { name: "Add heading" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  for (const [kind, title] of [["Points of interest", "Kouros"], ["Places", "Harbour"]]) {
    await page.getByRole("button", { name: "+ Link" }).click();
    const picker = page.getByRole("dialog", { name: "Add a link" });
    await picker.getByRole("button", { name: kind, exact: true }).click();
    await picker.getByRole("button", { name: new RegExp(title) }).click();
    await expect(picker).toBeHidden();
  }
  await expect(page.getByRole("list", { name: "Main menu items" }).getByRole("listitem")).toHaveCount(3);

  // Both links under the heading, by keyboard; the harbour first.
  await page.getByRole("button", { name: "Move Kouros under the item above" }).press("Enter");
  await expect(page.getByText("Kouros is now under Επίσκεψη.")).toBeAttached();
  await page.getByRole("button", { name: "Move Harbour under the item above" }).press("Enter");
  await expect(page.getByText("Harbour is now under Επίσκεψη.")).toBeAttached();
  await page.getByRole("button", { name: "Move Harbour up" }).press("Enter");
  await expect(page.getByText("Moved Harbour to position 1 of 2.")).toBeAttached();
  await expect(page.getByRole("button", { name: "Move Harbour up" })).toBeDisabled();
  let primary = (await menus()).find((m) => m.context === "PRIMARY")!;
  expect(primary.items.map((i) => [i.depth, i.targetResourceId])).toEqual([[0, null], [1, harbour.id], [1, kouros.id]]);
  await expectNoAxeViolations(page, "Navigation with a heading and two links");

  // A label in English; Greek keeps using the target's title.
  await page.getByRole("button", { name: "Labels" }).nth(1).click();
  await expect(page.getByText(/Empty uses the title: Harbour/).first()).toBeVisible();
  await page.locator("[id^=nav-labels-panel-]").getByLabel("English", { exact: true }).fill("The harbour");
  await expectNoAxeViolations(page, "labels open");
  await page.getByRole("button", { name: "Save labels" }).click();
  await expect(page.getByText("Labels saved")).toBeVisible();
  primary = (await menus()).find((m) => m.context === "PRIMARY")!;
  expect(primary.items[1].labels).toEqual({ en: "The harbour" });
  await page.getByLabel("Labels in").selectOption("en");
  await expect(page.getByRole("list", { name: "Main menu items" }).getByText("The harbour", { exact: true })).toBeVisible();
  await page.getByLabel("Labels in").selectOption("el");

  // The preview draws the menu on mobile: in the burger when the theme's shell has one, else in the bottom bar,
  // where the heading opens what is under it.
  const preview = page.getByRole("complementary", { name: "Preview" });
  const burger = preview.getByRole("button", { name: "Μενού" });
  if (await burger.count()) {
    await burger.click();
    await expect(preview.getByText("Επίσκεψη", { exact: true })).toBeVisible();
  } else {
    await preview.getByRole("button", { name: /Επίσκεψη/ }).click();
  }
  const menu = preview.getByRole("navigation").filter({ hasText: "Harbour" });
  await expect(menu.getByRole("button", { name: "Harbour" })).toBeVisible();
  await expect(menu.getByRole("button", { name: "Kouros" })).toBeVisible();
  if (await burger.count()) await burger.click();

  // A footer link.
  await page.getByRole("tab", { name: /Footer links/ }).click();
  await expect(page.getByText("No footer links yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Heading" })).toHaveCount(0);
  await page.getByRole("button", { name: "+ Link" }).click();
  const picker = page.getByRole("dialog", { name: "Add a link" });
  await picker.getByRole("button", { name: "Places", exact: true }).click();
  await picker.getByRole("button", { name: /Harbour/ }).click();
  await expect(page.getByRole("tab", { name: /Footer links \(1\)/ })).toBeVisible();
  await expect(preview.locator("nav").filter({ hasText: "Harbour" }).last()).toBeVisible();
  await expectNoAxeViolations(page, "footer links");

  // Removing the heading removes what is under it, after a confirmation.
  await page.getByRole("tab", { name: /Main menu/ }).click();
  await page.getByRole("button", { name: "Remove Επίσκεψη" }).click();
  const confirm = page.getByRole("dialog", { name: /Remove Επίσκεψη/ });
  await expect(confirm.getByText(/The 2 items under it go too/)).toBeVisible();
  await confirm.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText(/The main menu is empty/)).toBeVisible();
  expect((await menus()).find((m) => m.context === "PRIMARY")!.items).toEqual([]);
});
