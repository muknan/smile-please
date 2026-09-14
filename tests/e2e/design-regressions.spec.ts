import { expect, test } from "@playwright/test";

test("mobile navigation exposes one close control without duplicate copy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  await expect(page.getByRole("button", { name: "Close menu" })).toHaveCount(1);
  await expect(page.getByText("Close menu", { exact: true })).toHaveCount(0);
});

test("care consent is a distinct green decision surface", async ({ page }) => {
  await page.goto("/care/request");
  const consent = page.getByRole("group", { name: "Consent" });
  await expect(consent).toBeVisible();

  const appearance = await consent.evaluate((element) => {
    const styles = getComputedStyle(element);
    const rgb = styles.backgroundColor.match(/\d+/g)?.map(Number) ?? [];
    return { rgb, radius: Number.parseFloat(styles.borderRadius) };
  });
  expect(appearance.rgb).toHaveLength(3);
  expect(appearance.rgb[1]).toBeGreaterThan(appearance.rgb[0]);
  expect(appearance.radius).toBeGreaterThanOrEqual(16);
});

test("dentists without availability do not offer a dead-end See times action", async ({ page }) => {
  await page.goto("/care/dentists");
  const unavailable = page.locator("article").filter({ hasText: "No times posted for the next 14 days" });
  expect(await unavailable.count()).toBeGreaterThan(0);

  for (const card of await unavailable.all()) {
    await expect(card.getByRole("link", { name: "See times" })).toHaveCount(0);
  }
});
