import { expect, test } from "@playwright/test";
import { api, newProject } from "./support/api.ts";
import { expectNoAxeViolations } from "./support/a11y.ts";

/*
 * "Preview in app" of a Resource editor (`12` §3 Resource editors; D-014, D-056, D-059): the prototype's pop-up card
 * below its button, its header holding the surface switch and Close, that draws the live form, unsaved changes
 * included, on Mobile, Web, or Kiosk; Escape, Close, or a click outside closes it and focus returns to the button.
 */
test("Preview in app opens as a pop-up with the unsaved form", async ({ page }) => {
  const project = await newProject("editorpreview");
  const place = await api<{ id: string }>("POST", `/projects/${project.id}/places`, { title: "Kymi", type: "SITE" });
  await page.goto(`/projects/${project.id}/places/${place.id}`);
  await page.getByLabel(/^summary$/i).fill("A harbour town on the east coast.");

  const button = page.getByRole("button", { name: "Preview in app" });
  await button.click();
  const dialog = page.getByRole("dialog", { name: "Preview in app: Kymi" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("A harbour town on the east coast.")).toBeVisible();
  await expect(dialog.getByText("Shows unsaved changes")).toBeVisible();
  // It opens on the chosen screen's tab, not on Close.
  await expect(dialog.getByRole("tab", { name: /mobile/i })).toBeFocused();
  // A card below the button, right edges aligned, at most 560 pixels wide; Close sits in its header.
  const card = (await dialog.boundingBox())!;
  const opener = (await button.boundingBox())!;
  expect(card.width).toBeLessThanOrEqual(560);
  expect(card.y).toBeGreaterThanOrEqual(opener.y + opener.height);
  expect(Math.abs(card.x + card.width - (opener.x + opener.width))).toBeLessThanOrEqual(1);
  const close = (await dialog.getByRole("button", { name: "Close preview" }).boundingBox())!;
  const mobileTab = (await dialog.getByRole("tab", { name: /mobile/i }).boundingBox())!;
  expect(close.y).toBeLessThan(mobileTab.y + mobileTab.height);
  // The arrow keys move between screens; the screen is a labelled tab panel.
  await dialog.getByRole("tab", { name: /mobile/i }).press("ArrowRight");
  await expect(dialog.getByRole("tab", { name: /web/i })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.getByRole("tabpanel", { name: /web/i })).toBeVisible();
  await expect(dialog.getByText("A harbour town on the east coast.")).toBeVisible();
  await expectNoAxeViolations(page, "editor preview pop-up");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();

  // Close in the header shuts it as well, focus back on the button.
  await button.click();
  await dialog.getByRole("button", { name: "Close preview" }).click();
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
});
