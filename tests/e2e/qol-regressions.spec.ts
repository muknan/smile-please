import { expect, test } from "@playwright/test";

test("mobile navigation uses spacing, marks nested routes active, and gives both actions full targets", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/care/dentists");
  await page.getByRole("button", { name: "Open menu" }).click();

  const menu = page.getByRole("dialog", { name: "Site menu" });
  const careLink = menu.getByRole("link", { name: "Find care" });
  await expect(careLink).toHaveAttribute("aria-current", "page");

  const itemBorders = await menu.locator('nav[aria-label="Mobile menu"] > a').evaluateAll((links) =>
    links.map((link) => getComputedStyle(link).borderBottomWidth),
  );
  expect(itemBorders.every((width) => width === "0px")).toBe(true);

  const signIn = menu.getByRole("link", { name: "Sign in" });
  expect((await signIn.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await expect(signIn).toHaveCSS("border-bottom-style", "solid");
});

test("contact audience choices all fit at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact");
  const tablist = page.getByRole("tablist", { name: "What best describes you?" });
  const listBox = await tablist.boundingBox();
  expect(listBox).not.toBeNull();

  for (const tab of await tablist.getByRole("tab").all()) {
    const box = await tab.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(listBox!.x - 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(listBox!.x + listBox!.width + 1);
  }
});

test("an unavailable dentist offers concrete recovery actions", async ({ page }) => {
  await page.goto("/care/dentists/rohit-verma-karol-bagh");
  await expect(page.getByText(/no open slots in the next two weeks/i)).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse other dentists" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Request care" })).toBeVisible();
});

test("public chrome contains no unfinished trust-detail placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/registered trust details to be supplied/i)).toHaveCount(0);
});

test("mobile footer groups care and learning links without a long single-column tail", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const care = page.getByRole("navigation", { name: "Care" });
  const learn = page.getByRole("navigation", { name: "Learn" });
  const careBox = await care.boundingBox();
  const learnBox = await learn.boundingBox();
  expect(careBox).not.toBeNull();
  expect(learnBox).not.toBeNull();
  expect(Math.abs(careBox!.y - learnBox!.y)).toBeLessThan(2);
});

test("home title does not repeat the product name", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Smile Please — Free dental care in Delhi");
});
