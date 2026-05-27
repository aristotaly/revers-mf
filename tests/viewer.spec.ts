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
  expectedUrl: string | RegExp = "**/dashboard",
) {
  await page.goto("/login");
  await page.getByTestId("username-input").fill(username);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL(expectedUrl);
}

async function logout(page: Page) {
  await page.goto("/logout");
  await page.waitForURL("**/login");
}

/**
 * Creates a regular tracker user named `username` from the admin console.
 * Assumes we're already on /admin signed in as admin.
 */
async function createRegularUser(
  page: Page,
  { name, username, password }: { name: string; username: string; password: string },
) {
  await page.getByTestId("add-user-button").click();
  await page.getByTestId("new-role-user").click();
  await page.getByTestId("new-name-input").fill(name);
  await page.getByTestId("new-username-input").fill(username);
  await page.getByTestId("new-password-input").fill(password);
  await page.getByTestId("create-user-submit").click();
  await expect(page.getByText(`User "${username}" created`)).toBeVisible();
}

async function createViewerUser(
  page: Page,
  {
    name,
    username,
    password,
    targets,
  }: {
    name: string;
    username: string;
    password: string;
    targets: string[];
  },
) {
  await page.getByTestId("add-user-button").click();
  await page.getByTestId("new-role-viewer").click();
  await page.getByTestId("new-name-input").fill(name);
  await page.getByTestId("new-username-input").fill(username);
  await page.getByTestId("new-password-input").fill(password);
  for (const t of targets) {
    await page.getByTestId(`viewer-target-option-${t}`).click();
  }
  await page.getByTestId("create-user-submit").click();
  await expect(page.getByText(`Viewer "${username}" created`)).toBeVisible();
}

test.describe("Viewer accounts", () => {
  test.beforeEach(async () => {
    runSeed();
  });

  test("create viewer requires a target", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    await page.getByTestId("add-user-button").click();
    await page.getByTestId("new-role-viewer").click();
    await page.getByTestId("new-name-input").fill("View Only");
    await page.getByTestId("new-username-input").fill("vonly");
    await page.getByTestId("new-password-input").fill("vonly1234");
    await page.getByTestId("create-user-submit").click();
    await expect(page.getByTestId("create-user-error")).toBeVisible();
  });

  test("single-target viewer goes straight to that user's dashboard", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin");
    await createRegularUser(page, {
      name: "Tracker One",
      username: "trackone",
      password: "track1234",
    });
    await createViewerUser(page, {
      name: "Solo Viewer",
      username: "solo",
      password: "solo1234",
      targets: ["trackone"],
    });

    // Row shows viewer pill + assigned target.
    await expect(page.getByTestId("user-row-solo")).toBeVisible();
    await expect(page.getByTestId("viewer-targets-solo")).toContainText(
      "Can view: trackone",
    );

    await logout(page);
    await login(page, "solo", "solo1234", "**/dashboard");
    await expect(page.getByTestId("viewer-active-user")).toHaveText(
      "Tracker One",
    );
    // No add-user link, no admin link.
    await expect(page.getByTestId("admin-link")).toHaveCount(0);
    // Switcher hidden because there's only one target.
    await expect(page.getByTestId("viewer-switch-trigger")).toHaveCount(0);
  });

  test("multi-target viewer sees picker and can switch between users", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin");
    await createRegularUser(page, {
      name: "Tracker One",
      username: "trackone",
      password: "track1234",
    });
    await createRegularUser(page, {
      name: "Tracker Two",
      username: "tracktwo",
      password: "track1234",
    });
    await createViewerUser(page, {
      name: "Multi Viewer",
      username: "multi",
      password: "multi1234",
      targets: ["trackone", "tracktwo"],
    });

    await logout(page);
    await login(page, "multi", "multi1234", "**/dashboard");

    // Picker shows both targets.
    await expect(page.getByTestId("viewer-target-grid")).toBeVisible();
    await expect(page.getByTestId("viewer-target-trackone")).toBeVisible();
    await expect(page.getByTestId("viewer-target-tracktwo")).toBeVisible();

    await page.getByTestId("viewer-target-trackone").click();
    await expect(page.getByTestId("viewer-active-user")).toHaveText(
      "Tracker One",
    );

    // Switcher visible because more than one target.
    await page.getByTestId("viewer-switch-trigger").click();
    await page.getByTestId("viewer-switch-option-tracktwo").click();
    await expect(page.getByTestId("viewer-active-user")).toHaveText(
      "Tracker Two",
    );
  });

  test("viewer write attempts are blocked", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    await createRegularUser(page, {
      name: "Tracker One",
      username: "trackone",
      password: "track1234",
    });
    await createViewerUser(page, {
      name: "Solo Viewer",
      username: "solo",
      password: "solo1234",
      targets: ["trackone"],
    });

    await logout(page);
    await login(page, "solo", "solo1234", "**/dashboard");

    // /goal and /scale-weight redirect viewers away — they never see the form.
    await page.goto("/goal");
    await page.waitForURL("**/dashboard");
    await page.goto("/scale-weight");
    await page.waitForURL("**/weight-trend");

    // Weigh-in calendar tiles are disabled (no add dialog) for viewers.
    await page.goto("/dashboard");
    const firstTile = page.locator('[data-testid^="weigh-in-day-"]').first();
    await expect(firstTile).toBeDisabled();
  });

  test("admin can manage a viewer's accessible users", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    await createRegularUser(page, {
      name: "Tracker One",
      username: "trackone",
      password: "track1234",
    });
    await createRegularUser(page, {
      name: "Tracker Two",
      username: "tracktwo",
      password: "track1234",
    });
    await createViewerUser(page, {
      name: "Solo Viewer",
      username: "solo",
      password: "solo1234",
      targets: ["trackone"],
    });

    await page.getByTestId("manage-access-solo").click();
    await page.getByTestId("manage-target-option-tracktwo").click();
    await page.getByTestId("manage-access-save").click();

    await expect(page.getByText("Access updated for solo")).toBeVisible();
    await expect(page.getByTestId("viewer-targets-solo")).toContainText(
      "tracktwo",
    );
  });

  test("admin can't promote/demote a viewer via the shield button", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin");
    await createRegularUser(page, {
      name: "Tracker One",
      username: "trackone",
      password: "track1234",
    });
    await createViewerUser(page, {
      name: "Solo Viewer",
      username: "solo",
      password: "solo1234",
      targets: ["trackone"],
    });

    await expect(page.getByTestId("toggle-role-solo")).toBeDisabled();
  });
});
