import { test, expect } from "@playwright/test";

// Dismiss any overlays that might block interactions
async function dismissOverlays(page: import("@playwright/test").Page) {
  // Wait for page to settle, then dismiss any cookie/consent banners
  await page.waitForTimeout(500);
  const overlay = page.locator(".fixed.bottom-4");
  if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Try to close it or click away
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }
}

test.describe("PROJ-1: Authentifizierung & Sicherheit", () => {
  test.describe("Route Protection (Middleware)", () => {
    test("AC: /dashboard redirects to /login when not authenticated", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login/);
    });

    test("AC: /dashboard/einstellungen redirects to /login when not authenticated", async ({
      page,
    }) => {
      await page.goto("/dashboard/einstellungen");
      await expect(page).toHaveURL(/\/login/);
    });

    test("AC: API routes return 401 when not authenticated", async ({
      request,
    }) => {
      const response = await request.get("/api/integrations/status");
      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toBe("Nicht authentifiziert");
    });
  });

  test.describe("Login Page", () => {
    test("AC: Login page renders with email and password fields", async ({
      page,
    }) => {
      await page.goto("/login");
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(
        page.locator('button[type="submit"]').first()
      ).toBeVisible();
    });

    test("AC: Login page has link to registration", async ({ page }) => {
      await page.goto("/login");
      await expect(
        page.getByRole("link", { name: "Registrieren" })
      ).toBeVisible();
    });
  });

  test.describe("Register Page", () => {
    test("AC: Register page renders with email, password, and confirm fields", async ({
      page,
    }) => {
      await page.goto("/register");
      await expect(page.locator('input[type="email"]')).toBeVisible();
      const passwordInputs = page.locator('input[type="password"]');
      await expect(passwordInputs).toHaveCount(2);
      await expect(
        page.locator('button[type="submit"]').first()
      ).toBeVisible();
    });

    test("AC: Register page has link to login", async ({ page }) => {
      await page.goto("/register");
      await expect(
        page.getByRole("link", { name: "Anmelden" })
      ).toBeVisible();
    });
  });

  test.describe("Navigation", () => {
    test("Login and Register pages have navigation links", async ({ page }) => {
      await page.goto("/login");
      const registerLink = page.getByRole("link", { name: "Registrieren" });
      await expect(registerLink).toBeVisible();
      await expect(registerLink).toHaveAttribute("href", "/register");

      await page.goto("/register");
      const loginLink = page.getByRole("link", { name: "Anmelden" });
      await expect(loginLink).toBeVisible();
      await expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  test.describe("German UI Language (NFA-504)", () => {
    test("HTML lang attribute is set to 'de'", async ({ page }) => {
      await page.goto("/login");
      await expect(page.locator("html")).toHaveAttribute("lang", "de");
    });

    test("Register page shows German text", async ({ page }) => {
      await page.goto("/register");
      await expect(
        page.getByText("Erstellen Sie Ihr Konto")
      ).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("Login page is usable on mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/login");
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(
        page.locator('button[type="submit"]').first()
      ).toBeVisible();
    });
  });
});
