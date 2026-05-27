import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DashboardGoal } from "@/lib/dashboard/build-dashboard-data";

type GoalProgressCardProps = {
  goal: DashboardGoal | null;
  /** Viewers see the card but can't navigate into the goal editor. */
  readOnly?: boolean;
};

export function GoalProgressCard({ goal, readOnly }: GoalProgressCardProps) {
  const percent = goal?.progressPercent ?? 0;
  const daysLabel = goal
    ? `Last ${goal.daysSinceStart} Days`
    : readOnly
      ? "No goal set"
      : "Set your target";

  const content = (
    <>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">Goal Progress</h3>
        <p className="text-xs text-neutral-500">{daysLabel}</p>
        {goal && (
          <p className="mt-1 text-xs text-neutral-600">
            {goal.startWeight.toFixed(1)} → {goal.targetWeight.toFixed(1)} kg ·
            now {goal.currentWeight.toFixed(1)} kg
          </p>
        )}
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percent}%` }}
          data-testid="goal-progress-bar"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-800">
          {goal
            ? `${percent}% · ${goal.kgRemaining} kg to go`
            : readOnly
              ? "—"
              : "Set goal"}
        </span>
        {!readOnly && (
          <ChevronRight className="h-4 w-4 text-neutral-400" aria-hidden />
        )}
      </div>
    </>
  );

  if (readOnly) {
    return (
      <div
        className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100"
        data-testid="goal-progress-card"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href="/goal"
      prefetch={false}
      className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-100 transition-shadow hover:shadow-md"
      data-testid="goal-progress-card"
    >
      {content}
    </Link>
  );
}
