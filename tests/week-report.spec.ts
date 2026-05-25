import { test, expect } from "@playwright/test";
import {
  buildWeekReportEntries,
  getLast7DaysRangeLocal,
} from "../lib/dashboard/week-report";

test.describe("week report range", () => {
  test("last 7 days ending on a fixed date", () => {
    const now = new Date(2026, 4, 19); // May 19, 2026 local
    const { start, end } = getLast7DaysRangeLocal(now);
    expect(end.getDate()).toBe(19);
    expect(start.getDate()).toBe(13);
    expect(end.getTime() - start.getTime()).toBe(6 * 24 * 60 * 60 * 1000);

    const entries = new Map([
      ["2026-05-13", 96],
      ["2026-05-19", 95.8],
    ]);
    const days = buildWeekReportEntries(entries, now);
    expect(days).toHaveLength(7);
    expect(days[0].weight).toBe(96);
    expect(days[6].weight).toBe(95.8);
    expect(days[3].weight).toBeNull();
  });
});
