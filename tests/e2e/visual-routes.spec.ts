import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  ["home", "/"],
  ["about", "/about"],
  ["care", "/care"],
  ["care-request", "/care/request"],
  ["dentists", "/care/dentists"],
  ["care-status", "/care/status"],
  ["contact", "/contact"],
  ["partners", "/partners"],
  ["learn", "/learn"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
  ["sign-in", "/auth/sign-in"],
] as const;

for (const [name, path] of routes) {
  test(`${name} visual checkpoint`, async ({ page }, testInfo) => {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(accessibility.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
    await page.screenshot({
      path: `.scratch/overhaul-v2/screens/${testInfo.project.name}/${name}.png`,
      fullPage: true,
    });
  });
}

test("first dentist profile visual checkpoint", async ({ page }, testInfo) => {
  await page.goto("/care/dentists");
  const href = await page.locator('a[href^="/care/dentists/"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.locator("h1")).toBeVisible();
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/${testInfo.project.name}/dentist-profile.png`, fullPage: true });
});

test("intermediate-width composition", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 820, height: 1100 });
  for (const [name, path] of [["home", "/"], ["dentists", "/care/dentists"], ["contact", "/contact"], ["sign-in", "/auth/sign-in"]] as const) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: `.scratch/overhaul-v2/screens/intermediate/${testInfo.project.name}-${name}.png`, fullPage: true });
  }
});

test("first article visual checkpoint", async ({ page }, testInfo) => {
  await page.goto("/learn");
  const href = await page.locator('a[href^="/learn/"]').first().getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page.locator("h1")).toBeVisible();
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/${testInfo.project.name}/article.png`, fullPage: true });
});

test("meaningful interaction states", async ({ page }, testInfo) => {
  await page.goto("/care/dentists?slots=1");
  await expect(page.getByRole("heading", { name: /no dentists match/i })).toBeVisible();
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/${testInfo.project.name}/dentists-empty.png`, fullPage: true });

  await page.goto("/auth/sign-in?error=link_expired");
  await expect(page.getByRole("alert").filter({ hasText: "expired" })).toBeVisible();
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/${testInfo.project.name}/sign-in-error.png`, fullPage: true });

  await page.goto("/contact");
  await page.getByRole("tab", { name: "I'm a dentist" }).click();
  await expect(page.getByRole("tabpanel", { name: "I'm a dentist" })).toBeVisible();
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/${testInfo.project.name}/contact-dentist.png`, fullPage: true });

  await page.goto("/care/request");
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.locator("#fullName")).toBeFocused();
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/${testInfo.project.name}/care-request-validation.png`, fullPage: true });
});

test("mobile menu interaction and protected redirect", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/${testInfo.project.name}/mobile-menu.png` });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();

  await page.goto("/account");
  await expect(page).toHaveURL(/\/auth\/sign-in\?next=%2Faccount/);
});

test("core tasks reflow at a 320px CSS viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const path of ["/", "/care/request", "/care/dentists", "/contact", "/auth/sign-in"]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});

test("wide-tablet composition and global recovery pages", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  for (const [name, path] of [["home", "/"], ["care-request", "/care/request"], ["learn", "/learn"], ["privacy", "/privacy"]] as const) {
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({ path: `.scratch/overhaul-v2/screens/wide-tablet/${testInfo.project.name}-${name}.png`, fullPage: true });
  }

  await page.goto("/403");
  await expect(page.getByRole("heading", { name: /don't have access/i })).toBeVisible();
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/wide-tablet/${testInfo.project.name}-403.png`, fullPage: true });

  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: "That page is not here" })).toBeVisible();
  await page.screenshot({ path: `.scratch/overhaul-v2/screens/wide-tablet/${testInfo.project.name}-not-found.png`, fullPage: true });
});
