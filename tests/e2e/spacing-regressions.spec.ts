import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("Learn filters connect visually to the article results", async ({ page }) => {
  await page.goto("/learn");
  const lastFilter = page.getByRole("link", { name: "Camps", exact: true });
  const firstArticle = page.locator("article").first();
  const [filterBox, articleBox] = await Promise.all([lastFilter.boundingBox(), firstArticle.boundingBox()]);
  expect(filterBox).not.toBeNull();
  expect(articleBox).not.toBeNull();
  expect(articleBox!.y - (filterBox!.y + filterBox!.height)).toBeLessThanOrEqual(40);
});

for (const route of ["/learn", "/partners", "/about", "/care"]) {
  test(`${route} starts with a compact mobile rhythm`, async ({ page }) => {
    await page.goto(route);
    const [headerBox, headingBox] = await Promise.all([
      page.locator("header").first().boundingBox(),
      page.locator("main > section").first().locator(":scope > .container-content > :first-child").boundingBox(),
    ]);
    expect(headerBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    expect(headingBox!.y - (headerBox!.y + headerBox!.height)).toBeLessThanOrEqual(72);
  });
}

test("Sign-in primary action is visible in the first mobile viewport", async ({ page }) => {
  await page.goto("/auth/sign-in");
  const action = page.getByRole("button", { name: "Email me a sign-in link" });
  await expect(action).toBeVisible();
  const box = await action.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(700);
});
