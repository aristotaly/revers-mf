import { test, expect, Page } from "@playwright/test";
import { execSync } from "child_process";

function runSeed() {
  execSync(`npx tsx prisma/seed-test.ts default`, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    },
  });
}

async function login(
  page: Page,
  username = "admin",
  password = "1234",
) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(username);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/weight-trend");
}

async function logout(page: Page) {
  await page.goto("/logout");
  await page.waitForURL("**/login");
}

test.describe("Admin console", () => {
  test.beforeEach(async () => {
    runSeed();
  });

  test("admin sees Manage users link; non-admin does not", async ({ page }) => {
    await login(page);
    await expect(page.getByTestId("admin-link")).toBeVisible();

    // Create a regular user via the admin server action, then sign in as them.
    await page.goto("/admin");
    await page.getByTestId("add-user-button").click();
    await page.getByTestId("new-name-input").fill("Casual Carl");
    await page.getByTestId("new-username-input").fill("carl");
    await page.getByTestId("new-password-input").fill("carl1234");
    await page.getByTestId("create-user-submit").click();
    await expect(page.getByText('User "carl" created')).toBeVisible();

    await logout(page);
    await login(page, "carl", "carl1234");
    await expect(page.getByTestId("admin-link")).toHaveCount(0);
    // Non-admin hitting /admin should be redirected away.
    await page.goto("/admin");
    await page.waitForURL("**/weight-trend");
  });

  test("create user via simplified modal + toast notification", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin");

    await page.getByTestId("add-user-button").click();
    await page.getByTestId("new-name-input").fill("Test User");
    await page.getByTestId("new-username-input").fill("alice");
    await page.getByTestId("new-password-input").fill("alice1234");

    await page.getByTestId("create-user-submit").click();

    await expect(page.getByText('User "alice" created')).toBeVisible();
    await expect(page.getByTestId("user-row-alice")).toBeVisible();
    await expect(page.getByTestId("user-username-alice")).toHaveText("alice");

    // The new user must be able to log in with the password we set.
    await logout(page);
    await login(page, "alice", "alice1234");
    await expect(page).toHaveURL(/\/weight-trend/);
  });

  test("admin can reset another user's password", async ({ page }) => {
    await login(page);
    await page.goto("/admin");

    // Create bob.
    await page.getByTestId("add-user-button").click();
    await page.getByTestId("new-name-input").fill("Bob");
    await page.getByTestId("new-username-input").fill("bob");
    await page.getByTestId("new-password-input").fill("oldpass");
    await page.getByTestId("create-user-submit").click();
    await expect(page.getByText('User "bob" created')).toBeVisible();

    // Reset password.
    await page.getByTestId("reset-password-bob").click();
    await page.getByTestId("reset-password-input").fill("newpass");
    await page.getByTestId("reset-password-submit").click();
    await expect(page.getByText("Password reset for bob")).toBeVisible();

    // New password works; old one doesn't.
    await logout(page);
    await page.goto("/login");
    await page.getByTestId("username-input").fill("bob");
    await page.getByTestId("password-input").fill("oldpass");
    await page.getByTestId("login-submit").click();
    await expect(page.getByTestId("login-error")).toBeVisible();

    await login(page, "bob", "newpass");
  });

  test("admin can promote a user to admin and back", async ({ page }) => {
    await login(page);
    await page.goto("/admin");

    // Create dave.
    await page.getByTestId("add-user-button").click();
    await page.getByTestId("new-name-input").fill("Dave");
    await page.getByTestId("new-username-input").fill("dave");
    await page.getByTestId("new-password-input").fill("dave1234");
    await page.getByTestId("create-user-submit").click();
    await expect(page.getByText('User "dave" created')).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByTestId("toggle-role-dave").click();
    await expect(page.getByText("dave is now admin")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByTestId("toggle-role-dave").click();
    await expect(page.getByText("dave is now user")).toBeVisible();
  });

  test("admin cannot delete or demote themselves", async ({ page }) => {
    await login(page);
    await page.goto("/admin");

    await expect(page.getByTestId("delete-user-admin")).toBeDisabled();
    await expect(page.getByTestId("toggle-role-admin")).toBeDisabled();
  });

  test("admin can delete a non-admin user", async ({ page }) => {
    await login(page);
    await page.goto("/admin");

    await page.getByTestId("add-user-button").click();
    await page.getByTestId("new-name-input").fill("Eve");
    await page.getByTestId("new-username-input").fill("eve");
    await page.getByTestId("new-password-input").fill("eve12345");
    await page.getByTestId("create-user-submit").click();
    await expect(page.getByTestId("user-row-eve")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByTestId("delete-user-eve").click();

    await expect(page.getByText("Deleted eve")).toBeVisible();
    await expect(page.getByTestId("user-row-eve")).toHaveCount(0);
  });
});
