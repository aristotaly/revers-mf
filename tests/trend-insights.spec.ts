import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  buildDailySeries,
  computeTrendInsights,
  KCAL_PER_KG_TREND_WEIGHT,
} from "../utils/analytics";

function runSeed(mode: "macrofactor") {
  execSync(`npx tsx prisma/seed-test.ts ${mode}`, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    },
  });
}

test.describe("Trend insights (MacroFactor-style)", () => {
  test.beforeAll(() => {
    runSeed("macrofactor");
  });

  test("weight changes and 3-week rate metrics on macrofactor dataset", async () => {
    const data = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "scripts", "macrofactor-logged.json"),
        "utf-8",
      ),
    ) as { entries: { date: string; weight: number }[] };

    const entries = data.entries.map((e) => {
      const [y, m, d] = e.date.split("-").map((s) => parseInt(s, 10));
      return {
        date: new Date(Date.UTC(y, m - 1, d)),
        weight: e.weight,
      };
    });

    const today = new Date("2026-05-25T00:00:00.000Z");
    const series = buildDailySeries(entries, today);
    const ins = computeTrendInsights(series, today);

    expect(ins.currentTrendKg).toBeGreaterThan(90);
    expect(ins.hasRateMetrics).toBe(true);

    const w7 = ins.weightChanges.find((r) => r.days === 7);
    expect(w7).toBeDefined();
    expect(Math.abs(w7!.changeKg)).toBeLessThan(2);

    expect(ins.weeklyChangeKg).not.toBeNull();
    expect(ins.energyBalanceKcalPerDay).not.toBeNull();
    expect(ins.projection30Kg).not.toBeNull();

    if (ins.weeklyChangeKg != null && ins.energyBalanceKcalPerDay != null) {
      const implied = Math.round(
        (ins.weeklyChangeKg * KCAL_PER_KG_TREND_WEIGHT) / 7,
      );
      expect(ins.energyBalanceKcalPerDay).toBe(implied);
    }

    if (
      ins.weeklyChangeKg != null &&
      ins.projection30Kg != null &&
      ins.currentTrendKg != null
    ) {
      const expectedProj =
        Math.round(
          (ins.currentTrendKg + (ins.weeklyChangeKg / 7) * 30) * 10,
        ) / 10;
      expect(ins.projection30Kg).toBe(expectedProj);
    }
  });

  test("UI shows insights section after login", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("username-input").fill("admin");
    await page.getByTestId("password-input").fill("1234");
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/dashboard");
    await page.goto("/weight-trend");

    await expect(page.getByTestId("trend-insights")).toBeVisible();
    await expect(page.getByTestId("weight-changes-grid")).toBeVisible();
    await expect(page.getByTestId("insight-current-trend")).toBeVisible();
    await expect(page.getByTestId("insight-weekly-change")).toBeVisible();
    await expect(page.getByTestId("insight-energy-balance")).toBeVisible();
    await expect(page.getByTestId("insight-projection-30")).toBeVisible();
  });
});
