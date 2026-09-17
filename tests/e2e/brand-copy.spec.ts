import { expect, test } from "@playwright/test";

const TAGLINE = "Healthier smiles for more people.";

test("uses the tagline only where it strengthens the brand", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("footer").getByText(TAGLINE, { exact: true })).toBeVisible();
  await expect(page.locator("header").getByText(TAGLINE, { exact: true })).toHaveCount(0);
  await expect(page.locator("main").getByText(TAGLINE, { exact: true })).toHaveCount(0);

  await page.goto("/about");

  await expect(page.locator("main").getByText(TAGLINE, { exact: true })).toBeVisible();
  await expect(page.getByText(TAGLINE, { exact: true })).toHaveCount(2);
});
