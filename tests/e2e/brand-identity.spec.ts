import { expect, test } from "@playwright/test";

const tagline = "Healthier smiles, within reach.";

test("brand lockup stays compact and accessible in the header", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 820, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const header = page.locator("header").first();
    await expect(header.getByRole("link", { name: "Smile Please — Home" })).toBeVisible();
    await expect(header.getByText(tagline)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test("tagline is restrained to brand-story surfaces", async ({ page, request }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByText(tagline)).toBeVisible();
  await expect(page.locator("main").getByText(tagline)).toHaveCount(0);

  await page.goto("/about");
  await expect(page.locator("main").getByText(tagline)).toBeVisible();

  const aboutResponse = await request.get("/about");
  expect(aboutResponse.ok()).toBe(true);
  const aboutHtml = await aboutResponse.text();
  expect(aboutHtml).toContain('<meta property="og:site_name" content="Smile Please"');
  expect(aboutHtml).toContain('<meta property="og:locale" content="en_IN"');
  expect(aboutHtml).toContain('<meta property="og:type" content="website"');
  expect(aboutHtml).toContain('/og?title=Why%20Smile%20Please%20exists');
});

test("compact app icon serves the refreshed hand mark", async ({ request }) => {
  const response = await request.get("/icon.svg");
  expect(response.ok()).toBe(true);
  const icon = await response.text();
  expect(icon).toContain('fill="#F8F5ED"');
  expect(icon).toContain("rotate(-35 9 24)");
});
