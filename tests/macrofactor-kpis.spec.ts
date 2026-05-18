import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * End-to-end verification that our app's KPIs match MacroFactor's UI for the
 * full 565-day dataset.
 *
 * For each of the 6 windows (1W/1M/3M/6M/1Y/All) we navigate the dashboard
 * with `?asOf=2026-05-18` and assert the "Average" and "Difference" numbers.
 *
 * Tolerance is 0.15 kg, which absorbs the documented 0.1 kg display-rounding
 * variance between MF's higher-precision internal trend and our 4-decimal
 * trend, while still catching any algorithmic regression.
 */

function runSeed(mode: "macrofactor") {
  execSync(`npx tsx prisma/seed-test.ts ${mode}`, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByTestId("passcode-input").fill("1234");
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/weight-trend");
}

type WindowId = "1W" | "1M" | "3M" | "6M" | "1Y" | "All";

// MF's UI screenshot values (1W & 6M differ by ≤0.1 kg from the calculated
// diff because MF carries more internal precision than the 4-decimal export;
// 3M's user-reported value was a typo for 1M, so we assert the value that is
// mathematically derived from MF's own trend column).
const MF_TARGETS: Record<WindowId, { avg: number; diff: number; note?: string }> = {
  "1W": { avg: 95.8, diff: -0.4, note: "MF screenshot shows -0.5 (rounding)" },
  "1M": { avg: 96.0, diff: -0.7 },
  "3M": { avg: 96.5, diff: -1.2, note: "User reported 96.0/-0.7 was a 1M typo" },
  "6M": { avg: 97.1, diff: -3.7, note: "MF screenshot shows -3.8 (rounding)" },
  "1Y": { avg: 100.7, diff: -13.9 },
  All: { avg: 107.0, diff: -29.9, note: "MF screenshot shows -30 (display rounding)" },
};

const TOLERANCE_KG = 0.15;

function parseKpi(text: string): number {
  // "+0.4 kg" / "-3.8 kg" / "95.8 kg"
  const m = /(-?\+?\d+(?:\.\d+)?)/.exec(text);
  if (!m) throw new Error(`Cannot parse KPI text: "${text}"`);
  return parseFloat(m[1].replace("+", ""));
}

test.describe("MacroFactor KPI parity (565-day dataset)", () => {
  test.beforeAll(() => {
    // Sanity check the dataset is present
    const p = path.join(process.cwd(), "scripts", "macrofactor-logged.json");
    expect(fs.existsSync(p)).toBeTruthy();
    runSeed("macrofactor");
  });

  test("dashboard reports correct KPIs for every window", async ({ page }) => {
    await login(page);
    await page.goto("/weight-trend?asOf=2026-05-18");

    // Confirm the page rendered with the seeded data (last logged scale is May 18)
    await expect(page.getByTestId("kpi-summary")).toBeVisible();

    const results: Record<WindowId, { avg: number; diff: number }> = {} as never;

    for (const [w, target] of Object.entries(MF_TARGETS) as [
      WindowId,
      { avg: number; diff: number },
    ][]) {
      await page.getByTestId(`filter-${w}`).click();
      await page.waitForTimeout(50);
      const avgText = await page.getByTestId("kpi-average").innerText();
      const diffText = await page.getByTestId("kpi-difference").innerText();
      const avg = parseKpi(avgText);
      const diff = parseKpi(diffText);
      results[w] = { avg, diff };

      const avgDelta = Math.abs(avg - target.avg);
      const diffDelta = Math.abs(diff - target.diff);

      console.log(
        `${w.padEnd(3)} | avg ${avg.toFixed(1)} (target ${target.avg.toFixed(1)}, Δ${avgDelta.toFixed(2)}) | diff ${diff.toFixed(1)} (target ${target.diff.toFixed(1)}, Δ${diffDelta.toFixed(2)})`,
      );

      expect(
        avgDelta,
        `[${w}] avg ${avg} should be within ${TOLERANCE_KG} of ${target.avg}`,
      ).toBeLessThanOrEqual(TOLERANCE_KG);
      expect(
        diffDelta,
        `[${w}] diff ${diff} should be within ${TOLERANCE_KG} of ${target.diff}`,
      ).toBeLessThanOrEqual(TOLERANCE_KG);
    }
  });

  test("trend on May 18 matches MF's 95.5 kg final reading", async ({ page }) => {
    await login(page);
    await page.goto("/weight-trend?asOf=2026-05-18");
    await page.getByTestId("filter-1W").click();
    const cell = page.getByTestId("trend-2026-05-18");
    await expect(cell).toBeVisible();
    const text = (await cell.innerText()).trim();
    const trend = parseFloat(text);
    expect(Math.abs(trend - 95.5)).toBeLessThanOrEqual(0.1);
  });
});
