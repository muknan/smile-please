import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicPages = [
  { path: "/", heading: /a painful tooth should not have to wait/i },
  { path: "/partners", heading: /make room for better care/i },
  { path: "/care/request", heading: /tell us what's wrong/i },
];

for (const pageCase of publicPages) {
  test(`${pageCase.path} is responsive and has no serious accessibility violations`, async ({ page }) => {
    await page.goto(pageCase.path);

    await expect(page.getByRole("heading", { level: 1, name: pageCase.heading })).toBeVisible();
    await expect(page.locator("body")).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const seriousViolations = accessibility.violations.filter(
      (violation) => violation.impact === "critical" || violation.impact === "serious",
    );
    expect(seriousViolations).toEqual([]);
  });
}
