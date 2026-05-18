/**
 * Run our actual analytics.ts on the MacroFactor logged-only dataset and
 * print the resulting KPIs for every window. Use this to verify (without a
 * browser) that our app produces the same numbers MF shows.
 */
import * as fs from "fs";
import * as path from "path";
import {
  buildDailySeries,
  computeKpis,
  normalizeDate,
  type TimeWindow,
} from "../utils/analytics";

const dataPath = path.join(
  process.cwd(),
  "scripts",
  "macrofactor-logged.json",
);
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as {
  today: string;
  expected_kpis: Record<string, { avg: number; diff: number }>;
  entries: { date: string; weight: number }[];
};

const [ty, tm, td] = data.today.split("-").map((s) => parseInt(s, 10));
const today = new Date(Date.UTC(ty, tm - 1, td));

const loggedEntries = data.entries.map((e) => {
  const [y, m, d] = e.date.split("-").map((s) => parseInt(s, 10));
  return {
    date: normalizeDate(new Date(Date.UTC(y, m - 1, d))),
    weight: e.weight,
  };
});

const series = buildDailySeries(loggedEntries, today);
console.log(`Series length: ${series.length} daily points`);
console.log(
  `First point: ${series[0].date.toISOString().slice(0, 10)} trend=${series[0].trend.toFixed(4)}`,
);
console.log(
  `Last point:  ${series[series.length - 1].date.toISOString().slice(0, 10)} trend=${series[series.length - 1].trend.toFixed(4)}`,
);

const windows: TimeWindow[] = ["1W", "1M", "3M", "6M", "1Y", "All"];

console.log("\n=== Our app's KPIs vs MF screenshot targets ===");
console.log(
  "Window | Our Avg | MF Avg | Δ Avg | Our Diff | MF Diff | Δ Diff",
);
console.log("-".repeat(70));

let allMatch = true;
for (const w of windows) {
  const kpis = computeKpis(series, loggedEntries, w, today);
  const target = data.expected_kpis[w];
  const dAvg = Math.round((kpis.average - target.avg) * 10) / 10;
  const dDiff = Math.round((kpis.difference - target.diff) * 10) / 10;
  const matches = Math.abs(dAvg) <= 0.1 && Math.abs(dDiff) <= 0.1;
  if (!matches) allMatch = false;
  console.log(
    `  ${w.padEnd(3)}  | ${kpis.average.toFixed(1).padStart(6)} | ${target.avg.toFixed(1).padStart(6)} | ${dAvg.toFixed(1).padStart(5)} | ${kpis.difference.toFixed(1).padStart(7)} | ${target.diff.toFixed(1).padStart(6)} | ${dDiff.toFixed(1).padStart(6)} ${matches ? "✓" : "✗"}`,
  );
}

if (allMatch) {
  console.log("\nAll KPIs within ±0.1 kg of MF screenshot targets.");
} else {
  console.log("\nSome KPIs differ by more than 0.1 kg from MF screenshot.");
}
