import { expect, test } from "@playwright/test";
import { api, newProject } from "./support/api.ts";
import { expectNoAxeViolations } from "./support/a11y.ts";

/*
 * A Guide story's reference block through the shared Resource picker (`12` §3 Guide, D-031, D-055): the picker
 * lists the Resources of the chosen kind, and the reference block shows its target and survives a save.
 */
test("a Guide story references a Point of Interest through the picker", async ({ page }) => {
  const project = await newProject("guide");
  const base = `/projects/${project.id}`;
  await api("POST", `${base}/pois`, { title: "Kouros" });
  const guide = await api<{ id: string }>("POST", `${base}/guides`, { title: "Highlights" });

  await page.goto(`${base}/guides/${guide.id}`);
  await page.getByRole("button", { name: "+ Reference" }).last().click();
  const picker = page.getByRole("dialog", { name: "Add a reference" });
  await expect(picker.getByRole("button", { name: "Points of interest", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expectNoAxeViolations(page, "reference picker");
  await picker.getByRole("button", { name: /Kouros/ }).click();
  await expect(picker).toBeHidden();
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Unsaved changes")).toBeHidden();

  const saved = await api<{ blocks: { blockType: string; resourceType: string }[] }>("GET", `${base}/guides/${guide.id}`);
  expect(saved.blocks.map((b) => [b.blockType, b.resourceType])).toEqual([["REFERENCE", "POI"]]);
});
