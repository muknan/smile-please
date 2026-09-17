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

  await expect(learnLink.locator(".link-pending-indicator")).toHaveClass(/is-pending/, { timeout: 300 });
  await expect(learnLink.locator('[aria-live="polite"]')).toHaveText("Loading destination…", { timeout: 300 });
  await expect(page.getByRole("status", { name: "Loading Learn" })).toHaveCSS("opacity", "1", { timeout: 500 });
  releasePrefetch();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Plain answers about your mouth" })).toBeVisible();
});

test("reduced motion removes spatial mobile-menu animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const menu = page.getByRole("navigation", { name: "Mobile menu" });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("animation-name", "none");

  await page.getByRole("button", { name: "Close menu" }).click();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
  await expect(page.locator("#mobile-menu")).toBeHidden();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
});
