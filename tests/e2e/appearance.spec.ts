import { expect, test } from "@playwright/test";

const STORAGE_KEY = "smile-please-appearance";

async function openAppearance(page: import("@playwright/test").Page) {
  const control = page.getByRole("button", { name: "Appearance", exact: true });
  if (!(await control.isVisible())) await page.getByRole("button", { name: "Open menu" }).click();
  await control.click();
}

test("System follows live OS appearance and can be restored after an override", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");

  await openAppearance(page);
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await openAppearance(page);
  await expect(page.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("menuitemradio", { name: "System" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
});

test("Light override starts light under dark OS and stays light on reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript((key) => localStorage.setItem(key, "light"), STORAGE_KEY);
  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("Dark override is applied before hydration without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript((key) => localStorage.setItem(key, "dark"), STORAGE_KEY);
  await page.goto("/learn", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect(page.getByRole("heading", { name: "Plain answers about your mouth" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("appearance choice stays selected when switching between mobile and desktop navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openAppearance(page);
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await openAppearance(page);
  await expect(page.getByRole("menuitemradio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
});

test("appearance menu supports arrow keys and Escape without closing the mobile menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openAppearance(page);
  const system = page.getByRole("menuitemradio", { name: "System" });
  const light = page.getByRole("menuitemradio", { name: "Light" });
  await expect(system).toBeFocused();
  await system.press("ArrowDown");
  await expect(light).toBeFocused();
  await light.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Appearance", exact: true })).toBeFocused();
  await openAppearance(page);
  await system.press("ArrowDown");
  await light.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
