import { expect, test } from "@playwright/test";

test("Learn categories have a filled selection and retain query navigation", async ({ page }) => {
  await page.goto("/learn");
  const categories = page.getByRole("navigation", { name: "Filter by topic" });
  const all = categories.getByRole("link", { name: "All" });
  const children = categories.getByRole("link", { name: "Children" });

  await expect(all).toHaveAttribute("aria-current", "page");
  await expect(all).toHaveCSS("background-color", /rgb\(/);
  await children.click();
  await expect(page).toHaveURL(/\/learn\?category=Children$/);
  await expect(children).toHaveAttribute("aria-current", "page");
  await expect(all).not.toHaveAttribute("aria-current", "page");
});

test("prominent arrow links and mobile nav avoid persistent underline", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const cta = page.getByRole("link", { name: "Find free care" });
  await expect(cta).toHaveCSS("text-decoration-line", "none");
  await page.getByRole("button", { name: "Open menu" }).click();
  const mobileAbout = page.getByRole("navigation", { name: "Mobile menu" }).getByRole("link", { name: "About" });
  await expect(mobileAbout).toHaveCSS("text-decoration-line", "none");
  await mobileAbout.focus();
  await expect(mobileAbout).toHaveCSS("text-decoration-line", "none");
});

test("opening a Learn category in another tab leaves current results intact", async ({ page, context }) => {
  await page.goto("/learn");
  const heading = page.getByRole("heading", { name: "Plain answers about your mouth" });
  await expect(heading).toBeVisible();
  const category = page.getByRole("navigation", { name: "Filter by topic" }).getByRole("link", { name: "Children" });
  const nextPage = context.waitForEvent("page");
  await category.click({ modifiers: ["Control"] });
  const opened = await nextPage;
  await opened.close();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(heading).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Filter by topic" })).toHaveAttribute("aria-busy", "false");
});

test("slow category navigation shows a content-level pending state", async ({ page }) => {
  await page.goto("/learn");
  await page.route(/\/learn\?category=Children/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  const categories = page.getByRole("navigation", { name: "Filter by topic" });
  await categories.getByRole("link", { name: "Children" }).click({ noWaitAfter: true });
  await expect(categories).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("status")).toHaveText("Loading Children articles…");
  await expect(page).toHaveURL(/\/learn\?category=Children$/);
  await expect(categories.getByRole("link", { name: "Children" })).toHaveAttribute("aria-current", "page");
});
