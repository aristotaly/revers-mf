/**
 * Production smoke for the multi-user admin console. Runs only when
 * PLAYWRIGHT_BASE_URL points at a https host. We never delete the admin
 * user; we create a temp user with a randomized suffix, log in as them,
 * then clean up by deleting from the admin list.
 *
 *   set PLAYWRIGHT_BASE_URL=https://revers-mf.vercel.app
 *   set PROD_USERNAME=admin
 *   set PROD_PASSCODE=Amdocs101
 *   npx playwright test tests/admin-prod-smoke.spec.ts --reporter=list
 */
import { test, expect } from "@playwright/test";

const PROD_USERNAME = process.env.PROD_USERNAME ?? "admin";
const PROD_PASSCODE = process.env.PROD_PASSCODE ?? "Amdocs101";

test.describe("Production admin console smoke", () => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("https://"),
    "Only runs when PLAYWRIGHT_BASE_URL points at a deployed host",
  );

  test("admin can create + delete a user end-to-end", async ({ page }) => {
    const suffix = Math.random().toString(36).slice(2, 8);
    const tempUsername = `smoke${suffix}`;
    const tempPassword = `pw-${suffix}`;

    // 1. Log in as admin and visit /admin.
    await page.goto("/login");
    await page.getByTestId("username-input").fill(PROD_USERNAME);
    await page.getByTestId("password-input").fill(PROD_PASSCODE);
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByTestId("admin-link")).toBeVisible();

    await page.goto("/admin");
    await expect(page.getByTestId("user-row-admin")).toBeVisible();

    // 2. Create a temp user via the simplified modal.
    await page.getByTestId("add-user-button").click();
    await page.getByTestId("new-name-input").fill(`Smoke ${suffix}`);
    await page.getByTestId("new-username-input").fill(tempUsername);
    await page.getByTestId("new-password-input").fill(tempPassword);
    await page.getByTestId("create-user-submit").click();
    await expect(page.getByText(`User "${tempUsername}" created`)).toBeVisible();
    await expect(page.getByTestId(`user-row-${tempUsername}`)).toBeVisible();

    // 3. Sign out, log in as the new user, dashboard should show no admin link.
    await page.goto("/logout");
    await page.waitForURL("**/login");
    await page.getByTestId("username-input").fill(tempUsername);
    await page.getByTestId("password-input").fill(tempPassword);
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByTestId("admin-link")).toHaveCount(0);

    // 4. Back to admin, clean up.
    await page.goto("/logout");
    await page.waitForURL("**/login");
    await page.getByTestId("username-input").fill(PROD_USERNAME);
    await page.getByTestId("password-input").fill(PROD_PASSCODE);
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");
    await page.goto("/admin");
    page.once("dialog", (d) => d.accept());
    await page.getByTestId(`delete-user-${tempUsername}`).click();
    await expect(page.getByText(`Deleted ${tempUsername}`)).toBeVisible();
    await expect(page.getByTestId(`user-row-${tempUsername}`)).toHaveCount(0);
  });
});
