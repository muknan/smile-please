import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { delhiCalendarDate, delhiDayBounds } from "../../lib/delhi-time";

loadEnvConfig(process.cwd());

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

test("primary navigation stays focused on core visitor jobs", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const mainNav = page.getByRole("navigation", { name: "Main" });
  await expect(mainNav.getByRole("link")).toHaveCount(3);
  await expect(mainNav.getByRole("link", { name: "Find care" })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "Partner with us" })).toHaveCount(0);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Contact us" })).toBeVisible();
});

for (const path of ["/care/request"] as const) {
  test(`${path} derives the under-18 safeguard from age band`, async ({ page }) => {
    await page.goto(path);
    await page.getByLabel("Age band").selectOption("12_17");
    await expect(page.getByText(/cannot accept details for someone under 18/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Send my request" })).toBeDisabled();
    await expect(page.getByLabel("Booking for someone under 18?")).toHaveCount(0);
  });
}

test("direct booking without a valid hold prevents wasted form entry", async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  test.skip(!supabaseUrl || !serviceRoleKey, "Supabase test credentials are unavailable");

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: slot } = await supabase
    .from("availability_slots")
    .select("id")
    .limit(1)
    .maybeSingle();
  test.skip(!slot, "No slot exists for the direct-booking form fixture");

  await page.goto(`/care/book/${slot!.id}`);
  await expect(page.getByText(/hold has expired/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm booking" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to times" })).toBeVisible();
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

test("Delhi calendar helpers stay correct across the UTC date boundary", () => {
  const beforeDelhiMidnight = new Date("2026-09-15T18:29:59.000Z");
  const atDelhiMidnight = new Date("2026-09-15T18:30:00.000Z");

  expect(delhiCalendarDate(0, beforeDelhiMidnight)).toBe("2026-09-15");
  expect(delhiCalendarDate(0, atDelhiMidnight)).toBe("2026-09-16");
  expect(delhiDayBounds(1, beforeDelhiMidnight)).toEqual({
    start: "2026-09-15T18:30:00.000Z",
    end: "2026-09-16T18:30:00.000Z",
  });
});

test("public and not-found chrome provide a working skip link", async ({ page }) => {
  for (const path of ["/", "/this-page-does-not-exist"]) {
    await page.goto(path);
    const skip = page.getByRole("link", { name: "Skip to content" });
    await skip.focus();
    await expect(skip).toBeVisible();
    await skip.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  }
});

test("sitemap includes the public directory and partnership page", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  const body = await response.text();
  expect(body).toContain("/care/dentists");
  expect(body).toContain("/partners");
});
