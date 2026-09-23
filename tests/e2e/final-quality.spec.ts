import { expect, test, type Page } from "@playwright/test";
import { cn } from "../../lib/utils";
import { safeRedirectPath } from "../../lib/safe-redirect";

test("custom typography survives color utilities and still permits size overrides", () => {
  expect(cn("text-body-s", "text-neem-600")).toBe("text-body-s text-neem-600");
  expect(cn("text-display-m text-ink-950", "text-body-l")).toBe("text-ink-950 text-body-l");
});

test("sign-in destinations cannot escape the site through URL normalization", () => {
  for (const value of ["//evil.example", "/\\evil.example", "/\t/evil.example", "https://evil.example", null]) {
    expect(safeRedirectPath(value)).toBe("/account");
  }
  expect(safeRedirectPath("/care/dentists?reschedule=123")).toBe("/care/dentists?reschedule=123");
});

test("field wrappers preserve the sign-in security description", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveAttribute("aria-describedby", "signin-security");
});

test("closed mobile navigation is styled before JavaScript starts", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/about");
  await expect(page.locator("#mobile-menu")).toHaveCSS("visibility", "hidden");
  await context.close();
});

test("public form timestamps are minted per request, never frozen in the build", async ({ request }) => {
  for (const path of ["/care/request", "/auth/sign-in", "/partners"]) {
    const token = async () => {
      const response = await request.get(path);
      const html = await response.text();
      return html.match(/name="renderedAt" value="([^"]+)"/)?.[1];
    };
    const first = await token();
    expect(first, path).toBeTruthy();
    expect(await token(), path).not.toBe(first);
  }
});

// Exercise the real React Server Action lifecycle without sending email or
// changing patient data. The returned states match the server action contract.
async function returnActionState(page: Page, path: string, state: object) {
  await page.route(`**${path}`, async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: `0:{"a":"$@1","f":"","b":"test"}\n1:${JSON.stringify(state)}\n`,
    });
  });
}

test("rejected care requests retain entered details and focus the invalid field", async ({ page }) => {
  await page.goto("/care/request");
  await returnActionState(page, "/care/request", { status: "error", error: "Check the phone number.", issues: [{ path: "phone", message: "Check the phone number." }] });
  await page.getByRole("textbox", { name: "Full name" }).fill("QA retention check");
  await page.getByRole("textbox", { name: "Phone", exact: false }).fill("invalid phone");
  await page.locator("form").evaluate((form) => { (form as HTMLFormElement).noValidate = true; });
  await page.getByRole("button", { name: "Send my request" }).click();
  await expect(page.getByRole("textbox", { name: "Phone", exact: false })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("QA retention check");
  await expect(page.getByRole("textbox", { name: "Phone", exact: false })).toHaveValue("invalid phone");
  await expect(page.getByRole("textbox", { name: "Phone", exact: false })).toBeFocused();
});

test("sign-in success lets visitors choose another email", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await returnActionState(page, "/auth/sign-in", { status: "sent", email: "qa@example.invalid" });
  await page.getByLabel("Email address").fill("qa@example.invalid");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email." })).toBeVisible();
  await page.getByRole("button", { name: "Use a different email" }).click();
  await expect(page.getByLabel("Email address")).toBeEditable();
  await expect(page.getByLabel("Email address")).toHaveValue("");
});

test("arrow CTAs retain their layout and keep the final word with the icon", async ({ page }) => {
  await page.goto("/");
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const label of ["Find free care", "Explore oral-health guides", "View all guides", "Request free care"]) {
      const link = page.getByRole("link", { name: label, exact: true });
      const geometry = await link.evaluate((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let last: Text | null = null;
        while (walker.nextNode()) {
          if (walker.currentNode.textContent?.trim()) last = walker.currentNode as Text;
        }
        const range = document.createRange();
        range.selectNodeContents(last!);
        const rects = [...range.getClientRects()];
        const text = rects.at(-1)!;
        const icon = element.querySelector("svg")!.getBoundingClientRect();
        return { textTop: text.top, textBottom: text.bottom, iconTop: icon.top, iconBottom: icon.bottom };
      });
      expect(geometry.iconTop, `${label} at ${width}px`).toBeLessThan(geometry.textBottom);
      expect(geometry.iconBottom, `${label} at ${width}px`).toBeGreaterThan(geometry.textTop);
    }
  }
});

test("mobile menu releases the page when resized to desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeVisible();
  await expect(page.locator("#mobile-menu")).toHaveAttribute("data-open", "false");
});

test("mobile menu keyboard order includes the close button in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  const toggle = page.getByRole("button", { name: "Open menu", exact: true });
  // Safari deliberately does not focus buttons after a mouse click. Exercise
  // the keyboard path from the focused trigger, which is the behavior this
  // regression protects.
  await toggle.focus();
  await toggle.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Mobile menu" }).getByRole("link", { name: "About", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Close menu", exact: true })).toBeFocused();
});
