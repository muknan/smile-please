import { expect, type Page, test } from "@playwright/test";

const TOP_TOLERANCE = 12;

async function waitForSettledScroll(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(500);

  let previous = await page.evaluate(() => window.scrollY);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await page.waitForTimeout(100);
    const current = await page.evaluate(() => window.scrollY);
    if (Math.abs(current - previous) < 1) return;
    previous = current;
  }
}

async function scrollDeep(page: Page) {
  await page.evaluate(() => {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.min(720, maximum));
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
}

async function clickGlobalLink(page: Page, name: string) {
  const desktopLink = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name, exact: true });
  if (await desktopLink.isVisible()) {
    await desktopLink.click();
    return;
  }

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name, exact: true }).click();
}

async function clickHeaderAction(page: Page, name: string) {
  const directLink = page.locator("header").getByRole("link", { name, exact: true });
  if (await directLink.isVisible()) {
    await directLink.click();
    return;
  }

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name, exact: true }).click();
}

async function expectPageTop(page: Page) {
  await waitForSettledScroll(page);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(TOP_TOLERANCE);
}

test("deeply scrolled Learn to the logo always opens Home at the top", async ({ page }) => {
  for (let run = 0; run < 2; run += 1) {
    await page.goto("/learn");
    await scrollDeep(page);
    await page.locator("header").getByRole("link", { name: "Smile Please — home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expectPageTop(page);
  }
});

test("deeply scrolled Learn to About always opens About at the top", async ({ page }) => {
  for (let run = 0; run < 2; run += 1) {
    await page.goto("/learn");
    await scrollDeep(page);
    await clickGlobalLink(page, "About");
    await expect(page).toHaveURL(/\/about$/);
    await expectPageTop(page);
  }
});

test("deeply scrolled pages to Learn always open Learn at the top", async ({ page }) => {
  for (let run = 0; run < 2; run += 1) {
    await page.goto("/about");
    await scrollDeep(page);
    await clickGlobalLink(page, "Learn");
    await expect(page).toHaveURL(/\/learn$/);
    await expectPageTop(page);
  }
});

test("deeply scrolled Learn to Sign in always opens Sign in at the top", async ({ page }) => {
  for (let run = 0; run < 2; run += 1) {
    await page.goto("/learn");
    await scrollDeep(page);
    await clickHeaderAction(page, "Sign in");
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    await expectPageTop(page);
  }
});

test("Partner with us opens the Partners page at its top", async ({ page }) => {
  for (let run = 0; run < 2; run += 1) {
    await page.goto("/");
    await scrollDeep(page);
    await page.locator("main").getByRole("link", { name: "Partner with us", exact: true }).click();
    await expect(page).toHaveURL(/\/partners$/);
    await expect(page.getByRole("heading", { name: "Make room for better care." })).toBeVisible();
    await expectPageTop(page);
  }
});

test("Volunteer as a dentist opens the dentist contact destination at its top", async ({ page }) => {
  for (let run = 0; run < 2; run += 1) {
    await page.goto("/");
    await scrollDeep(page);
    await page.locator("main").getByRole("link", { name: "Volunteer as a dentist", exact: true }).click();
    await expect(page).toHaveURL(/\/contact\?tab=dentist$/);
    await expect(page.getByRole("tab", { name: "I'm a dentist" })).toHaveAttribute("aria-selected", "true");
    await expectPageTop(page);
  }
});

test("Back restores the previous deeply scrolled page", async ({ page }) => {
  await page.goto("/learn");
  await scrollDeep(page);
  const previousScroll = await page.evaluate(() => window.scrollY);

  await clickGlobalLink(page, "About");
  await expectPageTop(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/learn$/);
  await waitForSettledScroll(page);

  const restoredScroll = await page.evaluate(() => window.scrollY);
  expect(restoredScroll).toBeGreaterThan(previousScroll * 0.25);
  expect(Math.abs(restoredScroll - previousScroll)).toBeLessThan(0.75 * await page.evaluate(() => window.innerHeight));
  await expect(page.getByRole("dialog", { name: "Site menu" })).toHaveCount(0);
});

for (const destination of [
  { label: "Book a check-up", path: "/care" },
  { label: "Contact us", path: "/contact" },
  { label: "Privacy", path: "/privacy" },
  { label: "Terms", path: "/terms" },
] as const) {
  test(`footer ${destination.label} opens ${destination.path} at the top`, async ({ page }) => {
    await page.goto("/learn");
    await scrollDeep(page);
    await page.getByRole("contentinfo").getByRole("link", { name: destination.label, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${destination.path}$`));
    await expectPageTop(page);
  });
}
