import { test, expect } from "@playwright/test";

const PROD_USERNAME = process.env.PROD_USERNAME ?? "admin";
const PROD_PASSCODE = process.env.PROD_PASSCODE ?? "Amdocs101";

test.describe("Production dashboard smoke", () => {
  test.skip(
    !process.env.PLAYWRIGHT_BASE_URL?.startsWith("https://"),
    "Only runs against deployed host",
  );

  test("login lands on dashboard with widgets", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("username-input").fill(PROD_USERNAME);
    await page.getByTestId("password-input").fill(PROD_PASSCODE);
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard", { timeout: 60000 });
    await expect(page.getByTestId("weigh-in-card")).toBeVisible();
    await expect(page.getByTestId("weight-trend-mini-card")).toBeVisible();
    await expect(page.getByTestId("goal-progress-card")).toBeVisible();
  });
});
