"use client";

import Link from "next/link";
import type { DashboardPayload } from "@/lib/dashboard/build-dashboard-data";
import type { CurrentUser } from "@/lib/session";
import { WeighInCard } from "./weigh-in-card";
import { WeightTrendMiniCard } from "./weight-trend-mini-card";
import { GoalProgressCard } from "./goal-progress-card";
import { InstallPrompt } from "@/components/install-prompt";

type DashboardShellProps = {
  data: DashboardPayload;
  currentUser?: CurrentUser;
};

export function DashboardShell({ data, currentUser }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-neutral-100 pb-20">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-100 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Dashboard</h1>
            {currentUser && (
              <p className="text-sm text-neutral-500">Hi, {currentUser.name}</p>
            )}
          </div>
          {currentUser?.role === "admin" && (
            <Link
              href="/admin"
              prefetch={false}
              className="text-sm text-violet-700 underline"
              data-testid="admin-link"
            >
              Users
            </Link>
          )}
        </div>
      </header>

      <InstallPrompt />

      <div className="space-y-6 px-4 py-4">
        <section>
          <h2 className="mb-3 text-base font-bold text-neutral-900">Habits</h2>
          <div className="grid grid-cols-2 gap-3">
            <WeighInCard days={data.weighInDays} weekLogged={data.weekLogged} />
            <WeightTrendMiniCard
              points={data.trendPoints7d}
              latestTrend={data.latestTrend}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-neutral-900">
            Insights &amp; Analytics
          </h2>
          <GoalProgressCard goal={data.goal} />
        </section>
      </div>
    </div>
  );
}
