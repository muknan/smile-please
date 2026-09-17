import { expect, test } from "@playwright/test";

test.describe("focused interaction regressions", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile menu keeps one stable branded header throughout opening", async ({ page }) => {
    await page.goto("/");

    const homeLinks = page.getByRole("link", { name: "Smile Please — home" });
    const header = page.locator("header").first();
    const initialHeader = await header.boundingBox();
    expect(initialHeader).not.toBeNull();

    await page.getByRole("button", { name: "Open menu" }).click();

    const menuSurface = page.getByRole("navigation", { name: "Mobile menu" });
    await expect(menuSurface).toBeVisible();
    const menuBox = await menuSurface.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(menuBox!.y).toBeGreaterThanOrEqual(initialHeader!.height - 5);
    expect(menuBox!.height).toBeGreaterThan(700);

    for (const elapsed of [0, 40, 100, 220]) {
      if (elapsed > 0) await page.waitForTimeout(elapsed);
      const visibleHomeLinks = await homeLinks.evaluateAll((links) => links.filter((link) => {
        const rect = link.getBoundingClientRect();
        const style = getComputedStyle(link);
        return style.visibility !== "hidden" && style.display !== "none" && rect.bottom > 0 && rect.top < innerHeight;
      }).length);
      expect(visibleHomeLinks).toBe(1);
      const currentHeader = await header.boundingBox();
      expect(currentHeader).not.toBeNull();
      expect(Math.abs(currentHeader!.x - initialHeader!.x)).toBeLessThan(1);
      expect(Math.abs(currentHeader!.y - initialHeader!.y)).toBeLessThan(1);
    }
  });

  test("care request exposes one visible What’s wrong question and keeps its legend", async ({ page }) => {
    await page.goto("/care/request");

    const group = page.getByRole("group", { name: /what(?:'|’)s wrong/i });
    await expect(group).toBeVisible();
    await expect(group.locator("legend")).toBeVisible();
    await expect(page.getByText(/^what(?:'|’)s wrong\??(?: \*)?$/i)).toHaveCount(1);
  });

  test("active mobile link closes the menu and its exit layer stops catching input", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("button", { name: "Open menu" }).click();

    await page.getByRole("navigation", { name: "Mobile menu" }).getByRole("link", { name: "About" }).click();

    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(page.locator("#mobile-menu")).toHaveCSS("pointer-events", "none");
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("mobile menu surface stays mounted through repeated toggles", async ({ page }) => {
    await page.goto("/about");
    const surface = page.locator("#mobile-menu");

    await expect(surface).toHaveCount(1);
    await expect(surface).toHaveCSS("transition-duration", "0.15s, 0.15s, 0s");
    await expect(surface).toHaveCSS("animation-name", "none");
    for (let index = 0; index < 8; index += 1) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(surface).toHaveAttribute("data-open", "true");
      await page.getByRole("button", { name: "Close menu" }).click();
      await expect(surface).toHaveAttribute("data-open", "false");
    }

    await expect(surface).toHaveCount(1);
  });

  test("mobile menu links do not flash a pending underline", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("button", { name: "Open menu" }).click();

    const menu = page.getByRole("navigation", { name: "Mobile menu" });
    await expect(menu.locator(".link-pending-indicator")).toHaveCount(0);
  });
});

test("delayed Learn navigation replaces stale content with meaningful feedback", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  let prefetchStarted = false;
  let releasePrefetch!: () => void;
  const prefetchGate = new Promise<void>((resolve) => { releasePrefetch = resolve; });
  await page.route(/\/learn(?:\?|$)/, async (route) => {
    const headers = await route.request().allHeaders();
    if (headers["next-router-prefetch"] === "1") {
      prefetchStarted = true;
      await prefetchGate;
      await route.continue();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });

  await page.goto("/about");
  await expect.poll(() => prefetchStarted).toBe(true);

  const learnLink = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Learn", exact: true });
  await learnLink.click({ noWaitAfter: true });

  await expect(learnLink.locator(".link-pending-indicator")).toHaveCount(0);
  await expect(learnLink.locator('[aria-live="polite"]')).toHaveText("Loading destination…", { timeout: 300 });
  await expect(page.getByRole("status", { name: "Loading Learn" })).toHaveCSS("opacity", "1", { timeout: 500 });
  releasePrefetch();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Plain answers about your mouth" })).toBeVisible();
});

test("delayed logo navigation shows a Home-shaped pending surface", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let releasePrefetch!: () => void;
  const prefetchGate = new Promise<void>((resolve) => { releasePrefetch = resolve; });
  await page.route(/\/(?:\?|$)/, async (route) => {
    const headers = await route.request().allHeaders();
    if (headers["next-router-prefetch"] === "1") await prefetchGate;
    else await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });

  await page.goto("/about");
  const logo = page.locator("header").getByRole("link", { name: "Smile Please — home" });
  await logo.click({ noWaitAfter: true });

  await expect(logo.locator(".link-pending-indicator")).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Loading Home" })).toHaveCSS("opacity", "1", { timeout: 500 });
  releasePrefetch();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "A painful tooth should not have to wait." })).toBeVisible();
});

test("delayed dentist-directory navigation shows directory-shaped feedback", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let releasePrefetch!: () => void;
  const prefetchGate = new Promise<void>((resolve) => { releasePrefetch = resolve; });
  await page.route(/\/care\/dentists(?:\?|$)/, async (route) => {
    const headers = await route.request().allHeaders();
    if (headers["next-router-prefetch"] === "1") await prefetchGate;
    else await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });

  await page.goto("/care");
  const directoryLink = page.getByRole("link", { name: /Let me pick a dentist and time/ });
  await directoryLink.click({ noWaitAfter: true });

  await expect(directoryLink.locator(".link-pending-indicator")).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Loading Dentists" })).toHaveCSS("opacity", "1", { timeout: 500 });
  releasePrefetch();
  await expect(page).toHaveURL(/\/care\/dentists$/);
  await expect(page.getByRole("heading", { name: "Our dentists" })).toBeVisible();
});

test("every public destination responds without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const routes = [
    "/", "/about", "/care", "/care/request", "/care/dentists", "/care/dentists?slots=1",
    "/care/status", "/learn", "/learn?category=Children", "/contact", "/contact?tab=dentist",
    "/partners", "/privacy", "/terms", "/auth/sign-in",
  ];

  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.ok(), `${route} returned ${response?.status()}`).toBe(true);
    await expect(page.locator("main")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("reduced motion removes spatial mobile-menu transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const menu = page.getByRole("navigation", { name: "Mobile menu" });
  const surface = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  const reducedDuration = await surface.evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration));
  expect(reducedDuration).toBeLessThan(0.001);
  await expect(surface).toHaveCSS("transform", "none");

  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
});
