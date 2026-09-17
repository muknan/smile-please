import { expect, test } from "@playwright/test";

test("publishes iOS and legacy-compatible favicon formats", async ({ page, request }) => {
  await page.goto("/");

  const appleIcon = page.locator('link[rel="apple-touch-icon"]');
  await expect(appleIcon).toHaveCount(1);

  const appleIconHref = await appleIcon.getAttribute("href");
  expect(appleIconHref).toBeTruthy();

  const appleIconResponse = await request.get(appleIconHref!);
  expect(appleIconResponse.ok()).toBe(true);
  expect(appleIconResponse.headers()["content-type"]).toContain("image/png");

  const pngIcons = page.locator('link[rel="icon"][type="image/png"]');
  expect(await pngIcons.count()).toBeGreaterThanOrEqual(2);

  const faviconResponse = await request.get("/favicon.ico");
  expect(faviconResponse.ok()).toBe(true);
  expect(faviconResponse.headers()["content-type"]).toMatch(
    /image\/(?:x-icon|vnd\.microsoft\.icon)/,
  );
});
